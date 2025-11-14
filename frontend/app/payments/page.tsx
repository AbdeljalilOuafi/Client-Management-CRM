"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, Search, Loader2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listPayments, getPaymentStatistics, Payment, PaymentStatistics } from "@/lib/api/payments";
import { AuthGuard } from "@/components/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Navbar } from "@/components/Navbar";
import { PackageManagement } from "@/components/PackageManagement";
import { AddPaymentDialog } from "@/components/payments/AddPaymentDialog";

const columnDefinitions = [
  { id: "id", label: "Payment ID", default: true },
  { id: "amount", label: "Amount", default: true },
  { id: "currency", label: "Currency", default: true },
  { id: "exchange_rate", label: "Exchange Rate", default: true },
  { id: "status", label: "Status", default: true },
  { id: "payment_date", label: "Date", default: true },
  { id: "failure_reason", label: "Failure Reason", default: true },
  { id: "native_account_currency", label: "Client Currency", default: false },
  { id: "client_name", label: "Name", default: false },
];

const PaymentsContent = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columnDefinitions.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {})
  );

  // Fetch payments and statistics on mount
  useEffect(() => {
    fetchPayments();
    fetchStatistics();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listPayments({
        status: statusFilter !== "all" ? statusFilter : undefined,
        page_size: 100,
      });
      setPayments(response.results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch payments";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
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

  const filteredPayments = payments.filter(payment => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      (payment.client_name?.toLowerCase().includes(search)) ||
      (payment.client_email?.toLowerCase().includes(search)) ||
      (payment.client_id?.toString().includes(search)) ||
      (payment.id?.toString().includes(search))
    );
  });

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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold">Payment Management</h2>
              <p className="text-muted-foreground">Track and manage client payments</p>
            </div>
            <div className="flex gap-2">
              <AddPaymentDialog />
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

          {/* Filters & Search */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-background">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
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

          {/* Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.id && <TableHead>Payment ID</TableHead>}
                  {visibleColumns.amount && <TableHead>Amount</TableHead>}
                  {visibleColumns.currency && <TableHead>Currency</TableHead>}
                  {visibleColumns.exchange_rate && <TableHead>Exchange Rate</TableHead>}
                  {visibleColumns.status && <TableHead>Status</TableHead>}
                  {visibleColumns.payment_date && <TableHead>Date</TableHead>}
                  {visibleColumns.failure_reason && <TableHead>Failure Reason</TableHead>}
                  {visibleColumns.native_account_currency && <TableHead>Client Currency</TableHead>}
                  {visibleColumns.client_name && <TableHead>Name</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {visibleColumns.id && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.amount && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.currency && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.exchange_rate && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      {visibleColumns.status && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.payment_date && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      {visibleColumns.failure_reason && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                      {visibleColumns.native_account_currency && <TableCell><Skeleton className="h-4 w-16" /></TableCell>}
                      {visibleColumns.client_name && <TableCell><Skeleton className="h-4 w-32" /></TableCell>}
                    </TableRow>
                  ))
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      {visibleColumns.id && <TableCell className="font-medium">{payment.id}</TableCell>}
                      {visibleColumns.amount && <TableCell className="font-semibold">${Number(payment.amount).toFixed(2)}</TableCell>}
                      {visibleColumns.currency && <TableCell>{payment.currency || '-'}</TableCell>}
                      {visibleColumns.exchange_rate && <TableCell>{payment.exchange_rate ? Number(payment.exchange_rate).toFixed(6) : '-'}</TableCell>}
                      {visibleColumns.status && (
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.payment_date && <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>}
                      {visibleColumns.failure_reason && <TableCell className="text-sm text-muted-foreground">{payment.failure_reason || '-'}</TableCell>}
                      {visibleColumns.native_account_currency && <TableCell>{payment.native_account_currency || '-'}</TableCell>}
                      {visibleColumns.client_name && <TableCell>{payment.client_name || '-'}</TableCell>}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stats Footer */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total Payments: {statistics?.total_payments || 0}</span>
            <span>Filtered Results: {filteredPayments.length}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

const Payments = () => {
  return (
    <AuthGuard>
      <PaymentsContent />
    </AuthGuard>
  );
};

export default Payments;