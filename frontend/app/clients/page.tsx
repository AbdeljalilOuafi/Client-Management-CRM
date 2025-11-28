"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, ArrowUp, ArrowDown, Maximize2, UserPlus, Filter, CheckCircle2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddClientForm } from "@/components/AddClientForm";
import { listClients, getClientStatistics, Client } from "@/lib/api/clients";
import { AuthGuard } from "@/components/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";
import { AppLayout } from "@/components/AppLayout";
import { getToastErrorMessage } from "@/lib/utils/errorHandler";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { usePermissions } from "@/hooks/usePermissions";
import { AdvancedClientFilters, ClientFilters } from "@/components/clients/AdvancedClientFilters";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const columnDefinitions = [
  { id: "name", label: "Name", default: true, mandatory: true }, // Combined first + last name
  { id: "email", label: "Email", default: true },
  { id: "phone", label: "Phone", default: true },
  { id: "instagram_handle", label: "Instagram", default: false },
  { id: "dob", label: "DoB", default: false },
  { id: "id", label: "Client ID", default: true },
  { id: "address", label: "Address", default: false },
  { id: "country", label: "Country", default: false },
  { id: "client_start_date", label: "Start Date", default: true },
  { id: "client_end_date", label: "End Date", default: false },
  { id: "currency", label: "Default Currency", default: false },
  { id: "notice_given", label: "Notice Given", default: false },
  { id: "no_more_payments", label: "No More Payments", default: false },
  { id: "package_type", label: "Current Package Name", default: true },
  { id: "start_date", label: "Current Package Start Date", default: false },
  { id: "end_date", label: "Current Package End Date", default: false },
  { id: "number_months_paid", label: "Months on Package", default: false },
  { id: "latest_payment_amount", label: "Latest Payment Amount", default: true },
  { id: "latest_payment_date", label: "Latest Payment Date", default: true },
  { id: "lead_origin", label: "Lead Origin", default: false },
  { id: "ghl_id", label: "GHL ID", default: false },
  { id: "payment_method", label: "Stripe Account/Payment Method", default: false },
  { id: "stripe_customer_id", label: "Stripe Customer ID", default: false },
  { id: "status", label: "Status", default: false },
  { id: "coach_name", label: "Coach", default: false },
  { id: "closer", label: "Closer", default: false },
  { id: "setter", label: "Setter", default: false },
];

export default function Index() {
  const { toast } = useToast();
  const { canManageAllClients, user } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clientsColumnVisibility');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return columnDefinitions.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {});
  });
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clientsColumnOrder');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return columnDefinitions.map(col => col.id);
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [advancedFilters, setAdvancedFilters] = useState<ClientFilters>({});

  useEffect(() => {
    fetchStatistics();
    // Ensure mandatory columns are always visible
    setVisibleColumns(prev => ({
      ...prev,
      name: true, // Name is mandatory
    }));
  }, []);

  // Persist column visibility to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('clientsColumnVisibility', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, searchQuery, advancedFilters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[Clients Page] Fetching clients with filters:', {
        statusFilter,
        searchQuery,
        userRole: user?.role,
        userId: user?.id,
      });
      
      const response = await listClients({
        status: statusFilter,
        search: searchQuery || undefined,
      });
      
      console.log('[Clients Page] API Response:', {
        totalResults: response.results.length,
        results: response.results,
      });
      
      // Filter client-side for statuses not supported by backend
      let filteredClients = response.results;
      
      if (statusFilter === "paused") {
        filteredClients = response.results.filter(client => client.status === "paused");
      } else if (statusFilter === "pending") {
        filteredClients = response.results.filter(client => client.status === "pending");
      } else if (statusFilter === "all") {
        // Exclude pending clients from "All Clients" view
        filteredClients = response.results.filter(client => client.status !== "pending");
      }
      
      // Apply advanced filters client-side
      if (advancedFilters.status && advancedFilters.status !== "all") {
        filteredClients = filteredClients.filter(client => client.status === advancedFilters.status);
      }
      
      if (advancedFilters.givenNotice && advancedFilters.givenNotice !== "all") {
        const noticeValue = advancedFilters.givenNotice === "yes";
        filteredClients = filteredClients.filter(client => client.notice_given === noticeValue);
      }
      
      if (advancedFilters.ltvMin !== undefined) {
        filteredClients = filteredClients.filter(client => (client.ltv || 0) >= advancedFilters.ltvMin!);
      }
      
      if (advancedFilters.ltvMax !== undefined) {
        filteredClients = filteredClients.filter(client => (client.ltv || 0) <= advancedFilters.ltvMax!);
      }
      
      // Date range filters
      if (advancedFilters.startDateFrom) {
        filteredClients = filteredClients.filter(client => 
          client.client_start_date && client.client_start_date >= advancedFilters.startDateFrom!
        );
      }
      
      if (advancedFilters.startDateTo) {
        filteredClients = filteredClients.filter(client => 
          client.client_start_date && client.client_start_date <= advancedFilters.startDateTo!
        );
      }
      
      if (advancedFilters.endDateFrom) {
        filteredClients = filteredClients.filter(client => 
          client.client_end_date && client.client_end_date >= advancedFilters.endDateFrom!
        );
      }
      
      if (advancedFilters.endDateTo) {
        filteredClients = filteredClients.filter(client => 
          client.client_end_date && client.client_end_date <= advancedFilters.endDateTo!
        );
      }
      
      if (advancedFilters.latestPaymentDateFrom) {
        filteredClients = filteredClients.filter(client => 
          client.latest_payment_date && client.latest_payment_date >= advancedFilters.latestPaymentDateFrom!
        );
      }
      
      if (advancedFilters.latestPaymentDateTo) {
        filteredClients = filteredClients.filter(client => 
          client.latest_payment_date && client.latest_payment_date <= advancedFilters.latestPaymentDateTo!
        );
      }
      
      // Team filters
      if (advancedFilters.coach && advancedFilters.coach.length > 0) {
        filteredClients = filteredClients.filter(client => 
          client.coach_id && advancedFilters.coach!.includes(client.coach_id.toString())
        );
      }
      
      if (advancedFilters.closer && advancedFilters.closer.length > 0) {
        filteredClients = filteredClients.filter(client => 
          client.closer_id && advancedFilters.closer!.includes(client.closer_id.toString())
        );
      }
      
      if (advancedFilters.setter && advancedFilters.setter.length > 0) {
        filteredClients = filteredClients.filter(client => 
          client.setter_id && advancedFilters.setter!.includes(client.setter_id.toString())
        );
      }
      
      // Package Type filter
      if (advancedFilters.packageType && advancedFilters.packageType.length > 0) {
        filteredClients = filteredClients.filter(client => 
          client.package_type && advancedFilters.packageType!.includes(client.package_type)
        );
      }
      
      // Check-in Day filter (note: this field might not exist in client data yet)
      if (advancedFilters.checkinDay && advancedFilters.checkinDay.length > 0) {
        // TODO: Add checkin_day field to Client interface when backend supports it
        console.log("Check-in day filter selected but field not yet in client data:", advancedFilters.checkinDay);
      }
      
      // Country filter
      if (advancedFilters.country && advancedFilters.country.length > 0) {
        filteredClients = filteredClients.filter(client => 
          client.country && advancedFilters.country!.includes(client.country)
        );
      }
      
      // Stripe Account filter
      if (advancedFilters.stripeAccount && advancedFilters.stripeAccount.length > 0) {
        filteredClients = filteredClients.filter(client => 
          client.payment_method && advancedFilters.stripeAccount!.includes(client.payment_method)
        );
      }
      
      console.log('[Clients Page] Filtered clients:', {
        count: filteredClients.length,
        clients: filteredClients,
        appliedFilters: advancedFilters,
      });
      
      setClients(filteredClients);
    } catch (err) {
      console.error('[Clients Page] Error fetching clients:', err);
      const errorMessage = getToastErrorMessage(err, "Failed to fetch clients");
      setError(errorMessage.description);
      toast({
        ...errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const stats = await getClientStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Error fetching statistics:", err);
      const errorMessage = getToastErrorMessage(err, "Failed to fetch statistics");
      toast({
        ...errorMessage,
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    const aValue = a[sortColumn as keyof Client];
    const bValue = b[sortColumn as keyof Client];
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    const stringA = String(aValue).toLowerCase();
    const stringB = String(bValue).toLowerCase();
    return sortDirection === "asc" ? stringA.localeCompare(stringB) : stringB.localeCompare(stringA);
  });

  const handleClientUpdated = () => {
    fetchClients();
    fetchStatistics();
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setClientDetailsOpen(true);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    // Get the full column order array
    const newOrder = Array.from(columnOrder);
    
    // Find the actual column IDs at source and destination positions
    const visibleOrderedColumns = getOrderedColumns().filter(col => visibleColumns[col.id]);
    const sourceColumnId = visibleOrderedColumns[result.source.index]?.id;
    const destColumnId = visibleOrderedColumns[result.destination.index]?.id;
    
    if (!sourceColumnId || !destColumnId) return;
    
    // Find indices in the full column order array
    const sourceIndex = newOrder.indexOf(sourceColumnId);
    const destIndex = newOrder.indexOf(destColumnId);
    
    // Reorder the array
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destIndex, 0, removed);
    
    // Update state and localStorage
    setColumnOrder(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clientsColumnOrder', JSON.stringify(newOrder));
    }
  };

  // Get ordered columns based on columnOrder state
  const getOrderedColumns = () => {
    return columnOrder
      .map(id => columnDefinitions.find(col => col.id === id))
      .filter(Boolean) as typeof columnDefinitions;
  };

  const renderCellValue = (client: Client, columnId: string) => {
    switch (columnId) {
      case "name":
        return client.last_name ? `${client.first_name} ${client.last_name}` : client.first_name;
      case "email":
        return client.email;
      case "phone":
        return client.phone || "-";
      case "instagram_handle":
        return client.instagram_handle || "-";
      case "dob":
        return client.dob || "-";
      case "id":
        return client.id;
      case "address":
        return client.address || "-";
      case "country":
        return client.country || "-";
      case "client_start_date":
        return client.client_start_date || "-";
      case "client_end_date":
        return client.client_end_date || "-";
      case "currency":
        return client.currency || "-";
      case "notice_given":
        return (
          <Badge variant={client.notice_given ? "destructive" : "secondary"}>
            {client.notice_given ? "Yes" : "No"}
          </Badge>
        );
      case "no_more_payments":
        return (
          <Badge variant={client.no_more_payments ? "secondary" : "default"}>
            {client.no_more_payments ? "Yes" : "No"}
          </Badge>
        );
      case "package_type":
        return client.package_type || "-";
      case "start_date":
        return client.start_date || "-";
      case "end_date":
        return client.end_date || "-";
      case "number_months_paid":
        return client.number_months_paid || client.no_months || "-";
      case "latest_payment_amount":
        return client.latest_payment_amount 
          ? `${client.currency || 'USD'} ${client.latest_payment_amount.toFixed(2)}`
          : "-";
      case "latest_payment_date":
        return client.latest_payment_date || "-";
      case "lead_origin":
        return client.lead_origin || client.cta_lead_origin || "-";
      case "ghl_id":
        return client.ghl_id || "-";
      case "payment_method":
        return client.payment_method || "Stripe";
      case "stripe_customer_id":
        return client.stripe_customer_id || "-";
      case "status":
        return (
          <Badge 
            variant={client.status === 'active' ? 'default' : 'secondary'}
            className={
              client.status === 'active' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : client.status === 'inactive'
                ? 'bg-gray-500 hover:bg-gray-600 text-white'
                : client.status === 'paused'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : client.status === 'pending'
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : ''
            }
          >
            {client.status}
          </Badge>
        );
      case "coach_name":
        return client.coach_name || "-";
      case "closer":
        return client.closer || "-";
      case "setter":
        return client.setter || "-";
      default:
        return "-";
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Client Management</h2>
              <p className="text-muted-foreground">Manage and track your clients</p>
            </div>
            <div className="flex items-center gap-2">
              <ImportExportButtons 
                entityType="clients" 
                onImportSuccess={() => {
                  fetchClients();
                  fetchStatistics();
                }}
              />
              {canManageAllClients() && (
                <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-sm hover:shadow-md transition-all">
                      <UserPlus className="h-4 w-4" />
                      Add New Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Add New Client</DialogTitle>
                    </DialogHeader>
                    <AddClientForm onSuccess={() => { setAddClientOpen(false); fetchClients(); fetchStatistics(); }} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 shadow-sm"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-background shadow-sm">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">All Clients</SelectItem>
                      <SelectItem value="active">Active Clients</SelectItem>
                      <SelectItem value="inactive">Inactive Clients</SelectItem>
                      <SelectItem value="paused">Paused Clients</SelectItem>
                      <SelectItem value="pending">Pending Clients</SelectItem>
                    </SelectContent>
                  </Select>
                  <AdvancedClientFilters
                    filters={advancedFilters}
                    onFiltersChange={setAdvancedFilters}
                    onApply={fetchClients}
                  />
                </div>
                <Select value={sortColumn} onValueChange={setSortColumn}>
                  <SelectTrigger className="w-[180px] bg-background shadow-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {columnDefinitions.map((column) => (
                      <SelectItem key={column.id} value={column.id}>{column.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                  className="shadow-sm hover:shadow-md transition-all"
                >
                  {sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-all">
                      Columns ({Object.values(visibleColumns).filter(Boolean).length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[250px] bg-background z-50 p-0">
                    <div className="px-2 py-1.5 text-xs font-semibold border-b sticky top-0 bg-background z-10">
                      <div className="flex items-center justify-between">
                        <span>Show/Hide Columns</span>
                        <span className="text-muted-foreground font-normal">
                          {Object.values(visibleColumns).filter(Boolean).length}/{columnDefinitions.length}
                        </span>
                      </div>
                    </div>
                    <ScrollArea className="h-[400px]" type="always">
                      <div className="p-1 pr-4">
                        {columnDefinitions.map((column) => (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={visibleColumns[column.id]}
                            onCheckedChange={(checked) => {
                              setVisibleColumns((prev) => ({
                                ...prev,
                                [column.id]: checked,
                              }));
                            }}
                            disabled={column.mandatory}
                            className="cursor-pointer"
                          >
                            {column.label}
                            {column.mandatory && <span className="ml-2 text-xs text-muted-foreground">(Required)</span>}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </div>
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Client Statistics Summary */}
              <div className="flex gap-4 items-center text-sm border-t pt-4 mt-4">
                {statsLoading ? (
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ) : statistics ? (
                  <>
                    <span className="font-semibold text-foreground">
                      Total: <span className="text-primary">{statistics.total_clients || 0}</span>
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-medium">
                      Active: <span className="text-green-600">{statistics.active_clients || 0}</span>
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-medium">
                      Inactive: <span className="text-gray-600">{statistics.inactive_clients || 0}</span>
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="font-medium">
                      Pending: <span className="text-orange-600">{statistics.pending_clients || 0}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">No statistics available</span>
                )}
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <Skeleton className="h-10 flex-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm overflow-hidden">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                    <Droppable droppableId="table-headers" direction="horizontal">
                      {(provided) => (
                        <TableRow 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="hover:bg-transparent"
                        >
                          <TableHead className="w-12">View</TableHead>
                          {getOrderedColumns()
                            .filter(column => visibleColumns[column.id])
                            .map((column, index) => (
                              <Draggable
                                key={column.id}
                                draggableId={column.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <TableHead
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      position: snapshot.isDragging ? 'relative' : undefined,
                                      top: snapshot.isDragging ? 0 : undefined,
                                      left: snapshot.isDragging ? 0 : undefined,
                                      zIndex: snapshot.isDragging ? 1000 : undefined,
                                      transform: snapshot.isDragging 
                                        ? `${provided.draggableProps.style?.transform} scale(0.98)` 
                                        : undefined,
                                    }}
                                    className={`
                                      relative group
                                      transition-all duration-150 ease-out
                                      ${snapshot.isDragging 
                                        ? 'opacity-50 bg-muted/30' 
                                        : 'opacity-100'
                                      }
                                    `}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-max py-1">
                                      <div 
                                        {...provided.dragHandleProps}
                                        className={`
                                          flex-shrink-0 p-0.5 rounded
                                          transition-all duration-150
                                          ${snapshot.isDragging 
                                            ? 'opacity-0' 
                                            : 'opacity-0 group-hover:opacity-100 hover:bg-muted'
                                          }
                                          cursor-grab active:cursor-grabbing
                                        `}
                                      >
                                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                      </div>
                                      <span className="select-none font-medium text-sm">{column.label}</span>
                                    </div>
                                  </TableHead>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </TableRow>
                      )}
                    </Droppable>
                  </TableHeader>
                <TableBody>
                  {sortedClients.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className="rounded-full bg-muted p-6">
                            <Users className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold">No clients found</h3>
                            <p className="text-sm text-muted-foreground">
                              {searchQuery || statusFilter !== "all" 
                                ? "Try adjusting your search or filter criteria" 
                                : canManageAllClients()
                                  ? "Get started by adding your first client"
                                  : "You don't have any clients assigned to you yet"}
                            </p>
                            {!canManageAllClients() && !searchQuery && statusFilter === "all" && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Contact your admin to get clients assigned to you as a coach
                              </p>
                            )}
                          </div>
                          {!searchQuery && statusFilter === "all" && canManageAllClients() && (
                            <Button onClick={() => setAddClientOpen(true)} className="gap-2">
                              <UserPlus className="h-4 w-4" />
                              Add Your First Client
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedClients.map((client, index) => (
                      <TableRow 
                        key={client.id}
                        className={`transition-colors hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      >
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewClient(client)}>
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        {getOrderedColumns().map((column) => 
                          visibleColumns[column.id] && (
                            <TableCell key={column.id}>
                              {renderCellValue(client, column.id)}
                            </TableCell>
                          )
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </DragDropContext>
            </Card>
          )}

          {/* Showing count at bottom */}
          <div className="text-sm text-muted-foreground mt-4">
            <span>Showing: {sortedClients.length} clients</span>
          </div>

          </div>
        </div>

        <ClientDetailsDialog
          client={selectedClient}
          open={clientDetailsOpen}
          onOpenChange={(open) => {
            setClientDetailsOpen(open);
            if (!open) setSelectedClient(null);
          }}
          onClientUpdated={handleClientUpdated}
        />
      </AppLayout>
    </AuthGuard>
  );
}
