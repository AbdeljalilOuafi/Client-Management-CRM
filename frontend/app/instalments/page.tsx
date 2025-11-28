"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, Maximize2, Edit2, Save, X, User, Calendar, CheckCircle2, FileText, Hash, DollarSign, CreditCard, GripVertical, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddInstalmentForm } from "@/components/AddInstalmentForm";
import { getToastErrorMessage } from "@/lib/utils/errorHandler";
import { toast } from "sonner";
import { listInstalments, Instalment } from "@/lib/api/instalments";
import { AuthGuard } from "@/components/AuthGuard";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { usePermissions } from "@/hooks/usePermissions";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { AdvancedInstalmentFilters, InstalmentFilters } from "@/components/instalments/AdvancedInstalmentFilters";
import { InstalmentDetailsDialog } from "@/components/instalments/InstalmentDetailsDialog";

const columnDefinitions = [
  { id: "schedule_date", label: "Schedule Date", default: true, mandatory: false },
  { id: "stripe_account", label: "Stripe Account", default: true, mandatory: false },
  { id: "amount", label: "Amount", default: true, mandatory: false },
  { id: "currency", label: "Currency", default: true, mandatory: false },
  { id: "status", label: "Status", default: true, mandatory: false },
  { id: "date_created", label: "Date Created", default: true, mandatory: false },
  { id: "invoice_id", label: "Invoice ID", default: false, mandatory: false },
  { id: "client_email", label: "Email", default: true, mandatory: false },
  { id: "client", label: "Client ID", default: false, mandatory: false },
  { id: "client_name", label: "Client Name", default: true, mandatory: false },
  { id: "stripe_customer_id", label: "Stripe Customer ID", default: false, mandatory: false },
  { id: "date_updated", label: "Updated Date", default: false, mandatory: false }
];

const InstalmentsContent = () => {
  const { canManageAllInstallments } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("schedule_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedInstalment, setSelectedInstalment] = useState<Instalment | null>(null);
  const [instalmentDetailsOpen, setInstalmentDetailsOpen] = useState(false);
  const [addInstalmentOpen, setAddInstalmentOpen] = useState(false);
  const [instalments, setInstalments] = useState<Instalment[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancedFilters, setAdvancedFilters] = useState<InstalmentFilters>({});

  // Column visibility with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('instalmentsColumnVisibility');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return columnDefinitions.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {});
  });

  // Column order with localStorage persistence
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('instalmentsColumnOrder');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return columnDefinitions.map(col => col.id);
  });

  // Persist column visibility to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('instalmentsColumnVisibility', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  // Persist column order to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('instalmentsColumnOrder', JSON.stringify(columnOrder));
    }
  }, [columnOrder]);

  useEffect(() => {
    fetchInstalments();
  }, [statusFilter]);

  const fetchInstalments = async () => {
    setLoading(true);
    try {
      const response = await listInstalments({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page_size: 100,
      });
      setInstalments(response.results);
    } catch (err) {
      const errorMessage = getToastErrorMessage(err, "Failed to fetch instalments");
      toast.error(errorMessage.title, {
        description: errorMessage.description,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtering and sorting logic
  const filteredAndSortedInstalments = instalments.filter(instalment => {
    // Status filter
    if (statusFilter !== "all" && instalment.status !== statusFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesSearch = (
        instalment.client_name?.toLowerCase().includes(search) ||
        instalment.client?.toString().includes(search) ||
        instalment.id?.toString().includes(search) ||
        instalment.invoice_id?.toLowerCase().includes(search) ||
        instalment.stripe_customer_id?.toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }

    // Advanced filters
    if (advancedFilters.scheduleDateFrom) {
      const scheduleDate = new Date(instalment.schedule_date);
      if (scheduleDate < advancedFilters.scheduleDateFrom) return false;
    }

    if (advancedFilters.scheduleDateTo) {
      const scheduleDate = new Date(instalment.schedule_date);
      if (scheduleDate > advancedFilters.scheduleDateTo) return false;
    }

    if (advancedFilters.stripeAccount && advancedFilters.stripeAccount.length > 0) {
      if (!instalment.stripe_account || !advancedFilters.stripeAccount.includes(instalment.stripe_account)) {
        return false;
      }
    }

    if (advancedFilters.minAmount !== undefined && Number(instalment.amount) < advancedFilters.minAmount) {
      return false;
    }

    if (advancedFilters.maxAmount !== undefined && Number(instalment.amount) > advancedFilters.maxAmount) {
      return false;
    }

    if (advancedFilters.currency && advancedFilters.currency.length > 0) {
      if (!instalment.currency || !advancedFilters.currency.includes(instalment.currency)) {
        return false;
      }
    }

    if (advancedFilters.status && advancedFilters.status.length > 0) {
      if (!advancedFilters.status.includes(instalment.status)) {
        return false;
      }
    }

    if (advancedFilters.dateCreatedFrom) {
      const createdDate = new Date(instalment.date_created);
      if (createdDate < advancedFilters.dateCreatedFrom) return false;
    }

    if (advancedFilters.dateCreatedTo) {
      const createdDate = new Date(instalment.date_created);
      if (createdDate > advancedFilters.dateCreatedTo) return false;
    }

    if (advancedFilters.clientName && advancedFilters.clientName.length > 0) {
      if (!instalment.client_name || !advancedFilters.clientName.includes(instalment.client_name)) {
        return false;
      }
    }

    if (advancedFilters.stripeCustomerId) {
      if (!instalment.stripe_customer_id || !instalment.stripe_customer_id.toLowerCase().includes(advancedFilters.stripeCustomerId.toLowerCase())) {
        return false;
      }
    }

    if (advancedFilters.dateUpdatedFrom) {
      const updatedDate = new Date(instalment.date_updated);
      if (updatedDate < advancedFilters.dateUpdatedFrom) return false;
    }

    if (advancedFilters.dateUpdatedTo) {
      const updatedDate = new Date(instalment.date_updated);
      if (updatedDate > advancedFilters.dateUpdatedTo) return false;
    }

    return true;
  }).sort((a, b) => {
    let aValue: any = a[sortColumn as keyof Instalment];
    let bValue: any = b[sortColumn as keyof Instalment];

    if (aValue == null) aValue = "";
    if (bValue == null) bValue = "";

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    const stringA = String(aValue).toLowerCase();
    const stringB = String(bValue).toLowerCase();
    
    if (sortDirection === "asc") {
      return stringA.localeCompare(stringB);
    } else {
      return stringB.localeCompare(stringA);
    }
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  // Drag and drop handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(columnOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setColumnOrder(items);
  };

  // Get ordered columns
  const getOrderedColumns = () => {
    return columnOrder
      .map(id => columnDefinitions.find(col => col.id === id))
      .filter(Boolean) as typeof columnDefinitions;
  };

  // Render cell value
  const renderCellValue = (instalment: Instalment, columnId: string) => {
    switch (columnId) {
      case "schedule_date":
        return new Date(instalment.schedule_date).toLocaleDateString();
      case "date_created":
        return new Date(instalment.date_created).toLocaleDateString();
      case "date_updated":
        return new Date(instalment.date_updated).toLocaleDateString();
      case "amount":
        return `${instalment.currency} ${Number(instalment.amount).toFixed(2)}`;
      case "status":
        return (
          <Badge className={getStatusColor(instalment.status)}>
            {instalment.status.charAt(0).toUpperCase() + instalment.status.slice(1)}
          </Badge>
        );
      default:
        return (instalment as any)[columnId] || "-";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleApplyFilters = async () => {
    try {
      fetchInstalments();
    } catch (error: any) {
      toast.error("Failed to apply filters");
    }
  };

  const totalAmount = instalments
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="container mx-auto px-6 py-8">
      

      {/* Main Content */}
      
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Instalment Management</h2>
              <p className="text-muted-foreground">Track and manage client instalments</p>
            </div>
            {canManageAllInstallments() && (
              <Dialog open={addInstalmentOpen} onOpenChange={setAddInstalmentOpen}>
                <DialogTrigger asChild>
                  <Button>Add Instalment</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Instalment</DialogTitle>
                  </DialogHeader>
                  <AddInstalmentForm onSuccess={() => {
                    setAddInstalmentOpen(false);
                    fetchInstalments();
                  }} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold">{instalments.filter(i => i.status === 'paid').length}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold">{instalments.filter(i => i.status === 'open').length}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">{instalments.filter(i => i.status === 'failed').length}</p>
            </div>
          </div>

          {/* Filters & Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search instalments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instalments</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                
                <AdvancedInstalmentFilters
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                  onApply={handleApplyFilters}
                />

                <Select value={sortColumn} onValueChange={setSortColumn}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {columnDefinitions.map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.label}
                      </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleSortDirection}
              title={sortDirection === "asc" ? "Ascending" : "Descending"}
            >
              {sortDirection === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shadow-sm">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Columns
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
                        onCheckedChange={(checked) =>
                          setVisibleColumns((prev) => ({ ...prev, [column.id]: checked }))
                        }
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
        </CardContent>
      </Card>

          {/* Table */}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      Loading instalments...
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedInstalments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      No instalments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedInstalments.map((instalment: Instalment) => (
                    <TableRow 
                      key={instalment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedInstalment(instalment);
                        setInstalmentDetailsOpen(true);
                      }}
                    >
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      {getOrderedColumns().map((column) => 
                        visibleColumns[column.id] && (
                          <TableCell key={column.id}>
                            {renderCellValue(instalment, column.id)}
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

          {/* Stats Footer */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total Instalments: {instalments.length}</span>
            <span>Filtered Results: {filteredAndSortedInstalments.length}</span>
          </div>
        </div>

      <InstalmentDetailsDialog
        instalment={selectedInstalment}
        open={instalmentDetailsOpen}
        onOpenChange={(open) => {
          setInstalmentDetailsOpen(open);
          if (!open) setSelectedInstalment(null);
        }}
        onInstalmentUpdated={() => {
          fetchInstalments();
        }}
      />
    </div>
  );
};

const Instalments = () => {
  return (
    <AuthGuard>
      <PermissionGuard pageId="instalments" fallbackPath="/dashboard">
        <AppLayout>
          <InstalmentsContent />
        </AppLayout>
      </PermissionGuard>
    </AuthGuard>
  );
};

export default Instalments;