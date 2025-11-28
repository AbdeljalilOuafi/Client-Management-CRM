"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Maximize2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listPayments, getPaymentStatistics, Payment, PaymentStatistics } from "@/lib/api/payments";
import { AuthGuard } from "@/components/AuthGuard";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppLayout } from "@/components/AppLayout";
import { PackageManagement } from "@/components/PackageManagement";
import { AddPaymentDialog } from "@/components/payments/AddPaymentDialog";
import { getToastErrorMessage } from "@/lib/utils/errorHandler";
import { ImportExportButtons } from "@/components/ImportExportButtons";
import { usePermissions } from "@/hooks/usePermissions";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { AdvancedPaymentFilters, PaymentFilters } from "@/components/payments/AdvancedPaymentFilters";
import { PaymentDetailsDialog } from "@/components/payments/PaymentDetailsDialog";
import { Badge } from "@/components/ui/badge";

const columnDefinitions = [
  { id: "id", label: "Payment ID", default: true, mandatory: true },
  { id: "payment_method", label: "Account/Payment Method", default: true, mandatory: false },
  { id: "amount", label: "Amount", default: true, mandatory: false },
  { id: "currency", label: "Currency", default: true, mandatory: false },
  { id: "account_currency", label: "Account Currency", default: false, mandatory: false },
  { id: "exchange_rate", label: "Exchange Rate", default: false, mandatory: false },
  { id: "status", label: "Status", default: true, mandatory: false },
  { id: "payment_date", label: "Date", default: true, mandatory: false },
  { id: "failure_reason", label: "Failure Reason", default: false, mandatory: false },
  { id: "client_email", label: "Email", default: true, mandatory: false },
  { id: "client_id", label: "Client ID", default: false, mandatory: false },
  { id: "client_name", label: "Client Name", default: true, mandatory: false },
];

const PaymentsContent = () => {
  const { toast } = useToast();
  const { canManageAllPayments } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<PaymentFilters>({});
  const [sortColumn, setSortColumn] = useState<string>("payment_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Column visibility with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('paymentsColumnVisibility');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return columnDefinitions.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {});
  });

  // Column order with localStorage persistence
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('paymentsColumnOrder');
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return columnDefinitions.map(col => col.id);
  });

  // Persist column visibility to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentsColumnVisibility', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  // Fetch payments and statistics on mount
  useEffect(() => {
    fetchPayments();
    fetchStatistics();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPayments();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, advancedFilters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listPayments({
        page_size: 1000,
      });
      setPayments(response.results);
    } catch (err) {
      const errorMessage = getToastErrorMessage(err, "Failed to fetch payments");
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
      const stats = await getPaymentStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Failed to fetch payment statistics:", err);
    }
  };

  const filteredAndSortedPayments = payments.filter(payment => {
    // Status filter
    if (statusFilter !== "all" && payment.status !== statusFilter) {
      return false;
    }
    // Search query filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesSearch = (
        (payment.client_name?.toLowerCase().includes(search)) ||
        (payment.client_email?.toLowerCase().includes(search)) ||
        (payment.client_id?.toString().includes(search)) ||
        (payment.id?.toString().includes(search))
      );
      if (!matchesSearch) return false;
    }

    // Advanced filters
    if (advancedFilters.paymentMethod && advancedFilters.paymentMethod.length > 0) {
      if (!payment.payment_method || !advancedFilters.paymentMethod.includes(payment.payment_method)) {
        return false;
      }
    }

    if (advancedFilters.minAmount !== undefined && payment.amount < advancedFilters.minAmount) {
      return false;
    }

    if (advancedFilters.maxAmount !== undefined && payment.amount > advancedFilters.maxAmount) {
      return false;
    }

    if (advancedFilters.currency && advancedFilters.currency.length > 0) {
      if (!payment.currency || !advancedFilters.currency.includes(payment.currency)) {
        return false;
      }
    }

    if (advancedFilters.status && advancedFilters.status.length > 0) {
      const statusMap: Record<string, string> = {
        'Succeeded': 'paid',
        'Failed': 'failed',
        'Pending': 'incomplete',
        'Refunded': 'refunded',
        'Disputed': 'disputed'
      };
      const mappedStatuses = advancedFilters.status.map(s => statusMap[s] || s.toLowerCase());
      if (!mappedStatuses.includes(payment.status.toLowerCase())) {
        return false;
      }
    }

    if (advancedFilters.startDate) {
      const paymentDate = new Date(payment.payment_date);
      if (paymentDate < advancedFilters.startDate) {
        return false;
      }
    }

    if (advancedFilters.endDate) {
      const paymentDate = new Date(payment.payment_date);
      const endDate = new Date(advancedFilters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (paymentDate > endDate) {
        return false;
      }
    }

    if (advancedFilters.failureReason && payment.failure_reason) {
      if (!payment.failure_reason.toLowerCase().includes(advancedFilters.failureReason.toLowerCase())) {
        return false;
      }
    }

    if (advancedFilters.clientName && advancedFilters.clientName.length > 0) {
      if (!payment.client_name || !advancedFilters.clientName.includes(payment.client_name)) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const aValue = a[sortColumn as keyof Payment];
    const bValue = b[sortColumn as keyof Payment];
    
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    let comparison = 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const newOrder = Array.from(columnOrder);
    const visibleOrderedColumns = getOrderedColumns().filter(col => visibleColumns[col.id]);
    const sourceColumnId = visibleOrderedColumns[result.source.index]?.id;
    const destColumnId = visibleOrderedColumns[result.destination.index]?.id;
    
    if (!sourceColumnId || !destColumnId) return;
    
    const sourceIndex = newOrder.indexOf(sourceColumnId);
    const destIndex = newOrder.indexOf(destColumnId);
    
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(destIndex, 0, removed);
    
    setColumnOrder(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('paymentsColumnOrder', JSON.stringify(newOrder));
    }
  };

  const getOrderedColumns = () => {
    return columnOrder
      .map(id => columnDefinitions.find(col => col.id === id))
      .filter(Boolean) as typeof columnDefinitions;
  };

  const renderCellValue = (payment: Payment, columnId: string) => {
    switch (columnId) {
      case "id":
        return <span className="font-medium font-mono">{payment.id}</span>;
      case "payment_method":
        return payment.payment_method || "-";
      case "amount":
        return <span className="font-semibold">${Number(payment.amount).toFixed(2)}</span>;
      case "currency":
        return payment.currency || "-";
      case "account_currency":
        return payment.account_currency || "-";
      case "exchange_rate":
        return payment.exchange_rate ? Number(payment.exchange_rate).toFixed(6) : "-";
      case "status":
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </span>
        );
      case "payment_date":
        return new Date(payment.payment_date).toLocaleDateString();
      case "failure_reason":
        return <span className="text-sm text-muted-foreground">{payment.failure_reason || "-"}</span>;
      case "client_email":
        return payment.client_email || "-";
      case "client_id":
        return payment.client_id || "-";
      case "client_name":
        return payment.client_name || "-";
      default:
        return "-";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'disputed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold">Payment Management</h2>
              <p className="text-muted-foreground">Track and manage client payments</p>
            </div>
            <div className="flex gap-2">
              <ImportExportButtons 
                entityType="payments"
                onImportSuccess={() => {
                  fetchPayments();
                  fetchStatistics();
                }}
              />
              {canManageAllPayments() && <AddPaymentDialog />}
              <PackageManagement />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : (
                <p className="text-2xl font-bold">${statistics?.total_amount ? Number(statistics.total_amount).toFixed(2) : '0.00'}</p>
              )}
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Paid</p>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{statistics?.paid || 0}</p>
              )}
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Failed</p>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{statistics?.failed || 0}</p>
              )}
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold">{statistics?.total_payments || 0}</p>
              )}
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
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
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                    </SelectContent>
                  </Select>
                  <AdvancedPaymentFilters
                    filters={advancedFilters}
                    onFiltersChange={setAdvancedFilters}
                    onApply={fetchPayments}
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
                  <DropdownMenuContent align="end" className="w-[250px] max-h-[400px] overflow-y-auto bg-background z-50">
                    <div className="px-2 py-1.5 text-xs font-semibold border-b mb-1">
                      <div className="flex items-center justify-between">
                        <span>Show/Hide Columns</span>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={() => {
                              const defaults = columnDefinitions.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {});
                              setVisibleColumns(defaults);
                              setColumnOrder(columnDefinitions.map(col => col.id));
                            }}
                          >
                            Reset All
                          </Button>
                        </div>
                      </div>
                    </div>
                    {getOrderedColumns().map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={visibleColumns[column.id] ?? column.default}
                        onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, [column.id]: checked }))}
                        disabled={column.mandatory}
                      >
                        {column.label}
                        {column.mandatory && <span className="ml-2 text-xs text-muted-foreground">(Required)</span>}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          {loading ? (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
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
                  {filteredAndSortedPayments.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length + 1} className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <div className="rounded-full bg-muted p-6">
                            <Search className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold">No payments found</h3>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your search or filter criteria
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedPayments.map((payment) => (
                      <TableRow 
                        key={payment.id}
                        className="transition-colors hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setPaymentDetailsOpen(true);
                        }}
                      >
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        {getOrderedColumns().map((column) => 
                          visibleColumns[column.id] && (
                            <TableCell key={column.id}>
                              {renderCellValue(payment, column.id)}
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

          {/* Stats Footer */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total Payments: {statistics?.total_payments || 0}</span>
            <span>Filtered Results: {filteredAndSortedPayments.length}</span>
          </div>
      </div>

      <PaymentDetailsDialog
        payment={selectedPayment}
        open={paymentDetailsOpen}
        onOpenChange={(open) => {
          setPaymentDetailsOpen(open);
          if (!open) setSelectedPayment(null);
        }}
        onPaymentUpdated={() => {
          fetchPayments();
          fetchStatistics();
        }}
      />
    </div>
  );
};

const Payments = () => {
  return (
    <AuthGuard>
      <PermissionGuard pageId="payments" fallbackPath="/dashboard">
        <AppLayout>
          <PaymentsContent />
        </AppLayout>
      </PermissionGuard>
    </AuthGuard>
  );
};

export default Payments;