"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddClientForm } from "@/components/AddClientForm";
import { listClients, getClientStatistics, Client } from "@/lib/api/clients";
import { AuthGuard } from "@/components/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";
import { AppLayout } from "@/components/AppLayout";
import { getToastErrorMessage } from "@/lib/utils/errorHandler";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { usePermissions } from "@/hooks/usePermissions";
import { AdvancedClientFilters, ClientFilters } from "@/components/clients/AdvancedClientFilters";
import { ColumnManager } from "@/components/clients/ColumnManager";
import { ExpandedClientRow } from "@/components/clients/ExpandedClientRow";
import { 
  clientColumnDefinitions, 
  loadColumnVisibility, 
  saveColumnVisibility 
} from "@/lib/clientColumnDefinitions";

export default function AdvancedClientsPage() {
  const { toast } = useToast();
  const { canManageAllClients, user } = usePermissions();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => loadColumnVisibility());
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<ClientFilters>({});

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // TODO: Update API call to include advanced filters
      const response = await listClients({
        search: searchQuery || undefined,
        status: filters.status || undefined,
      });
      
      // Apply client-side filters (until backend supports all filters)
      let filteredClients = response.results;
      
      // Filter by status
      if (filters.status && filters.status !== "all") {
        filteredClients = filteredClients.filter(client => client.status === filters.status);
      }
      
      // Filter by notice given
      if (filters.givenNotice && filters.givenNotice !== "all") {
        const noticeValue = filters.givenNotice === "yes";
        filteredClients = filteredClients.filter(client => client.notice_given === noticeValue);
      }
      
      // Filter by LTV range
      if (filters.ltvMin !== undefined) {
        filteredClients = filteredClients.filter(client => 
          (client.ltv || 0) >= filters.ltvMin!
        );
      }
      if (filters.ltvMax !== undefined) {
        filteredClients = filteredClients.filter(client => 
          (client.ltv || 0) <= filters.ltvMax!
        );
      }
      
      // TODO: Add more filter logic as backend support is added
      
      setClients(filteredClients);
    } catch (err) {
      console.error('[Clients Page] Error fetching clients:', err);
      const errorMessage = getToastErrorMessage(err, "Failed to fetch clients");
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
    } finally {
      setStatsLoading(false);
    }
  };

  const handleClientUpdated = () => {
    fetchClients();
    fetchStatistics();
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setClientDetailsOpen(true);
  };

  const toggleRowExpansion = (clientId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    const newVisibility = { ...visibleColumns, [columnId]: visible };
    setVisibleColumns(newVisibility);
    saveColumnVisibility(newVisibility);
  };

  const renderCellValue = (client: Client, columnId: string) => {
    switch (columnId) {
      case "name":
        return `${client.first_name} ${client.last_name}`;
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
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status}
          </Badge>
        );
      case "coach_name":
        return client.coach_name || "-";
      case "closer":
        return client.closer || "-";
      case "setter":
        return client.setter || "-";
      case "ltv":
        return client.ltv 
          ? `${client.currency || 'USD'} ${client.ltv.toFixed(2)}`
          : "-";
      default:
        return "-";
    }
  };

  const visibleColumnDefs = clientColumnDefinitions.filter(
    col => visibleColumns[col.id] ?? col.defaultVisible
  );

  return (
    <AuthGuard>
      <AppLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Client Management</h2>
                <p className="text-muted-foreground">Manage and track your clients with advanced filtering</p>
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
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">Add New Client</DialogTitle>
                      </DialogHeader>
                      <AddClientForm onSuccess={() => { setAddClientOpen(false); fetchClients(); fetchStatistics(); }} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Filters and Controls */}
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex gap-4 items-center flex-wrap mb-4">
                  <div className="relative flex-1 min-w-[250px]">
                    <Input
                      placeholder="Search clients by name, email, or Instagram..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <AdvancedClientFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                      onApply={fetchClients}
                    />
                    <ColumnManager
                      visibleColumns={visibleColumns}
                      onVisibilityChange={handleColumnVisibilityChange}
                    />
                  </div>
                </div>

                {/* Statistics Summary */}
                <div className="flex gap-4 items-center text-sm border-t pt-4">
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

            {/* Table */}
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
                      <TableHead className="w-12"></TableHead>
                      {visibleColumnDefs.map((col) => (
                        <TableHead key={col.id}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={visibleColumnDefs.length + 1} className="text-center py-16">
                          <div className="flex flex-col items-center gap-4">
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold">No clients found</h3>
                              <p className="text-sm text-muted-foreground">
                                {searchQuery || Object.keys(filters).length > 0
                                  ? "Try adjusting your search or filter criteria" 
                                  : canManageAllClients()
                                    ? "Get started by adding your first client"
                                    : "You don't have any clients assigned to you yet"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      clients.map((client) => (
                        <>
                          <TableRow 
                            key={client.id}
                            className="transition-colors hover:bg-muted/50 cursor-pointer"
                          >
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRowExpansion(client.id)}
                                className="h-8 w-8 p-0"
                              >
                                {expandedRows.has(client.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            {visibleColumnDefs.map((col) => (
                              <TableCell key={col.id}>
                                {renderCellValue(client, col.id)}
                              </TableCell>
                            ))}
                          </TableRow>
                          {expandedRows.has(client.id) && (
                            <TableRow>
                              <TableCell colSpan={visibleColumnDefs.length + 1} className="p-0">
                                <ExpandedClientRow client={client} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* Showing count at bottom */}
            <div className="text-sm text-muted-foreground mt-4">
              <span>Showing: {clients.length} clients</span>
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
