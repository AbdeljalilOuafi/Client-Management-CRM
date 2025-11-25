"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, ArrowUp, ArrowDown, Maximize2, UserPlus, Filter, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddClientForm } from "@/components/AddClientForm";
import { listClients, getClientStatistics, Client } from "@/lib/api/clients";
import { AuthGuard } from "@/components/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";
import { AppLayout } from "@/components/AppLayout";
import { getToastErrorMessage } from "@/lib/utils/errorHandler";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { usePermissions } from "@/hooks/usePermissions";

const columnDefinitions = [
  { id: "id", label: "ID", default: true },
  { id: "first_name", label: "First Name", default: true },
  { id: "last_name", label: "Last Name", default: true },
  { id: "email", label: "Email", default: true },
  { id: "status", label: "Status", default: true },
  { id: "address", label: "Address", default: false },
  { id: "instagram_handle", label: "Instagram", default: false },
  { id: "ghl_id", label: "GHL ID", default: false },
  { id: "client_start_date", label: "Start Date", default: true },
  { id: "client_end_date", label: "End Date", default: false },
  { id: "dob", label: "Date of Birth", default: false },
  { id: "country", label: "Country", default: true },
  { id: "state", label: "State", default: false },
  { id: "currency", label: "Currency", default: false },
  { id: "gender", label: "Gender", default: false },
  { id: "lead_origin", label: "Lead Origin", default: false },
  { id: "notice_given", label: "Notice Given", default: false },
  { id: "no_more_payments", label: "No More Payments", default: false },
];

export default function Index() {
  const { toast } = useToast();
  const { canManageAllClients, user } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columnDefinitions.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {})
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [statusFilter, searchQuery]);

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
      
      console.log('[Clients Page] Filtered clients:', {
        count: filteredClients.length,
        clients: filteredClients,
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
                  <Filter className="h-4 w-4 text-muted-foreground" />
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
                    <Button variant="outline" className="shadow-sm hover:shadow-md transition-all">Columns</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] bg-background z-50">
                    {columnDefinitions.map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={visibleColumns[column.id]}
                        onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, [column.id]: checked }))}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
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
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">View</TableHead>
                    {visibleColumns.id && <TableHead>ID</TableHead>}
                    {visibleColumns.first_name && <TableHead>First Name</TableHead>}
                    {visibleColumns.last_name && <TableHead>Last Name</TableHead>}
                    {visibleColumns.email && <TableHead>Email</TableHead>}
                    {visibleColumns.status && <TableHead>Status</TableHead>}
                    {visibleColumns.address && <TableHead>Address</TableHead>}
                    {visibleColumns.instagram_handle && <TableHead>Instagram</TableHead>}
                    {visibleColumns.ghl_id && <TableHead>GHL ID</TableHead>}
                    {visibleColumns.client_start_date && <TableHead>Start Date</TableHead>}
                    {visibleColumns.client_end_date && <TableHead>End Date</TableHead>}
                    {visibleColumns.dob && <TableHead>Date of Birth</TableHead>}
                    {visibleColumns.country && <TableHead>Country</TableHead>}
                    {visibleColumns.state && <TableHead>State</TableHead>}
                    {visibleColumns.currency && <TableHead>Currency</TableHead>}
                    {visibleColumns.gender && <TableHead>Gender</TableHead>}
                    {visibleColumns.lead_origin && <TableHead>Lead Origin</TableHead>}
                    {visibleColumns.notice_given && <TableHead>Notice Given</TableHead>}
                    {visibleColumns.no_more_payments && <TableHead>No More Payments</TableHead>}
                  </TableRow>
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
                        {visibleColumns.id && <TableCell className="font-medium">{client.id}</TableCell>}
                        {visibleColumns.first_name && <TableCell>{client.first_name}</TableCell>}
                        {visibleColumns.last_name && <TableCell>{client.last_name || "-"}</TableCell>}
                        {visibleColumns.email && <TableCell>{client.email}</TableCell>}
                        {visibleColumns.status && <TableCell><Badge variant={client.status === 'active' ? 'success' : 'secondary'}>{client.status}</Badge></TableCell>}
                        {visibleColumns.address && <TableCell>{client.address || "-"}</TableCell>}
                        {visibleColumns.instagram_handle && <TableCell>{client.instagram_handle || "-"}</TableCell>}
                        {visibleColumns.ghl_id && <TableCell>{client.ghl_id || "-"}</TableCell>}
                        {visibleColumns.client_start_date && <TableCell>{client.client_start_date || "-"}</TableCell>}
                        {visibleColumns.client_end_date && <TableCell>{client.client_end_date || "-"}</TableCell>}
                        {visibleColumns.dob && <TableCell>{client.dob || "-"}</TableCell>}
                        {visibleColumns.country && <TableCell>{client.country || "-"}</TableCell>}
                        {visibleColumns.state && <TableCell>{client.state || "-"}</TableCell>}
                        {visibleColumns.currency && <TableCell>{client.currency || "-"}</TableCell>}
                        {visibleColumns.gender && <TableCell>{client.gender || "-"}</TableCell>}
                        {visibleColumns.lead_origin && <TableCell>{client.lead_origin || "-"}</TableCell>}
                        {visibleColumns.notice_given && <TableCell>{client.notice_given ? "Yes" : "No"}</TableCell>}
                        {visibleColumns.no_more_payments && <TableCell>{client.no_more_payments ? "Yes" : "No"}</TableCell>}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
