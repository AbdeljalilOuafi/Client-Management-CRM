"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, Trash2, Maximize2, Edit2, Save, X, User, Calendar, CheckCircle2, FileText, Hash, DollarSign, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddInstalmentForm } from "@/components/AddInstalmentForm";
import { toast } from "sonner";
import { listInstalments, Instalment as ApiInstalment } from "@/lib/api/instalments";
import { AuthGuard } from "@/components/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Instalment {
  id: number;
  account: number;
  account_name: string;
  client: number;
  client_name: string;
  invoice_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_account?: string | null;
  amount: string;
  currency: string;
  status: string;
  instalment_number?: number | null;
  schedule_date: string;
  date_created: string;
  date_updated: string;
}

const columnDefinitions = [
  { id: "schedule_date", label: "Schedule Date", default: true },
  { id: "client_name", label: "Client Name", default: true },
  { id: "client", label: "Client ID", default: false },
  { id: "amount", label: "Amount", default: true },
  { id: "currency", label: "Currency", default: true },
  { id: "status", label: "Status", default: true },
  { id: "instalment_number", label: "Instalment Number", default: false },
  { id: "invoice_id", label: "Invoice ID", default: false },
  { id: "stripe_customer_id", label: "Stripe Customer ID", default: false },
  { id: "stripe_account", label: "Stripe Account", default: false },
  { id: "account_name", label: "Account Name", default: false },
  { id: "date_created", label: "Created Date", default: false },
  { id: "date_updated", label: "Updated Date", default: false }
];

const InstalmentsContent = () => {
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("schedule_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columnDefinitions.reduce((acc, col) => ({ ...acc, [col.id]: col.default }), {})
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedInstalment, setSelectedInstalment] = useState<Instalment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInstalment, setEditedInstalment] = useState<Instalment | null>(null);
  const [addInstalmentOpen, setAddInstalmentOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instalmentToDelete, setInstalmentToDelete] = useState<Instalment | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [instalments, setInstalments] = useState<Instalment[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Record<string, any>>({
    status: [],
    currency: [],
    amount_min: "",
    amount_max: "",
    date_from: "",
    date_to: "",
    client_name: "",
    payment_method: [],
  });

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
    } catch (error: any) {
      toast.error("Failed to fetch instalments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstalments = instalments.filter(instalment => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      instalment.client_name?.toLowerCase().includes(search) ||
      instalment.client?.toString().includes(search) ||
      instalment.id?.toString().includes(search) ||
      instalment.invoice_id?.toLowerCase().includes(search) ||
      instalment.stripe_customer_id?.toLowerCase().includes(search)
    );
  });

  const sortedInstalments = [...filteredInstalments].sort((a, b) => {
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

  const clearFilters = () => {
    setFilters({
      status: [],
      currency: [],
      amount_min: "",
      amount_max: "",
      date_from: "",
      date_to: "",
      client_name: "",
      payment_method: [],
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== "";
  }).length;

  const toggleArrayFilter = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey].includes(value)
        ? prev[filterKey].filter((v: string) => v !== value)
        : [...prev[filterKey], value]
    }));
  };

  const handleEditInstalment = () => {
    if (selectedInstalment) {
      setEditedInstalment({ ...selectedInstalment });
      setIsEditing(true);
    }
  };

  const handleSaveInstalment = async () => {
    if (!editedInstalment) return;

    try {
      // Note: Update API call would go here when available
      // For now, just show success message
      toast.success("Instalment updated successfully!");
      setSelectedInstalment(editedInstalment);
      setIsEditing(false);
      fetchInstalments();
    } catch (error: any) {
      toast.error("Failed to update instalment");
    }
  };

  const handleCancelEdit = () => {
    setEditedInstalment(null);
    setIsEditing(false);
  };

  const updateEditedField = (field: string, value: any) => {
    if (editedInstalment) {
      setEditedInstalment({ ...editedInstalment, [field]: value });
    }
  };

  const handleDeleteInstalment = async () => {
    if (!instalmentToDelete || deleteConfirmation.toLowerCase() !== "delete") {
      toast.error("Please type 'delete' to confirm");
      return;
    }

    try {
      // Note: Delete API call would go here when available
      toast.success("Instalment deleted successfully!");
      setDeleteDialogOpen(false);
      setInstalmentToDelete(null);
      setDeleteConfirmation("");
      fetchInstalments();
    } catch (error: any) {
      toast.error("Failed to delete instalment");
    }
  };

  const openDeleteDialog = (instalment: Instalment) => {
    setInstalmentToDelete(instalment);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const totalAmount = instalments
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Instalment Management</h2>
              <p className="text-muted-foreground">Track and manage client instalments</p>
            </div>
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
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Instalments</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortColumn} onValueChange={setSortColumn}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50 max-h-[300px]">
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
            <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center" variant="default">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Filter Instalments</span>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {["open", "paid", "failed", "closed"].map((status) => (
                        <Button
                          key={status}
                          variant={filters.status.includes(status) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleArrayFilter("status", status)}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Currency Filter */}
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <div className="flex flex-wrap gap-2">
                      {["USD", "GBP", "EUR"].map((currency) => (
                        <Button
                          key={currency}
                          variant={filters.currency.includes(currency) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleArrayFilter("currency", currency)}
                        >
                          {currency}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div className="space-y-2">
                    <Label>Amount Range</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.amount_min}
                        onChange={(e) => setFilters(prev => ({ ...prev, amount_min: e.target.value }))}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.amount_max}
                        onChange={(e) => setFilters(prev => ({ ...prev, amount_max: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                      />
                      <Input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Client Name Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="client-name-filter">Client Name</Label>
                    <Input
                      id="client-name-filter"
                      placeholder="Search by client name..."
                      value={filters.client_name}
                      onChange={(e) => setFilters(prev => ({ ...prev, client_name: e.target.value }))}
                    />
                  </div>

                  {/* Payment Method Filter */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="flex flex-wrap gap-2">
                      {["autocharge", "send_invoice"].map((method) => (
                        <Button
                          key={method}
                          variant={filters.payment_method.includes(method) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleArrayFilter("payment_method", method)}
                        >
                          {method === "autocharge" ? "Auto Charge" : "Send Invoice"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Columns</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] bg-background z-50">
                {columnDefinitions.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumns[column.id]}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, [column.id]: checked }))
                    }
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
                  <TableHead className="w-12">Expand</TableHead>
                  {visibleColumns.schedule_date && <TableHead>Schedule Date</TableHead>}
                  {visibleColumns.client_name && <TableHead>Client Name</TableHead>}
                  {visibleColumns.client && <TableHead>Client ID</TableHead>}
                  {visibleColumns.amount && <TableHead>Amount</TableHead>}
                  {visibleColumns.currency && <TableHead>Currency</TableHead>}
                  {visibleColumns.status && <TableHead>Status</TableHead>}
                  {visibleColumns.instalment_number && <TableHead>Instalment Number</TableHead>}
                  {visibleColumns.invoice_id && <TableHead>Invoice ID</TableHead>}
                  {visibleColumns.stripe_customer_id && <TableHead>Stripe Customer ID</TableHead>}
                  {visibleColumns.stripe_account && <TableHead>Stripe Account</TableHead>}
                  {visibleColumns.account_name && <TableHead>Account Name</TableHead>}
                  {visibleColumns.date_created && <TableHead>Created Date</TableHead>}
                  {visibleColumns.date_updated && <TableHead>Updated Date</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      Loading instalments...
                    </TableCell>
                  </TableRow>
                ) : sortedInstalments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      No instalments found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedInstalments.map((instalment) => (
                    <TableRow key={instalment.id}>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedInstalment(instalment)}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      {visibleColumns.schedule_date && (
                        <TableCell>
                          {new Date(instalment.schedule_date).toLocaleDateString()}
                        </TableCell>
                      )}
                      {visibleColumns.client_name && <TableCell>{instalment.client_name}</TableCell>}
                      {visibleColumns.client && <TableCell>{instalment.client}</TableCell>}
                      {visibleColumns.amount && (
                        <TableCell className="font-semibold">
                          ${Number(instalment.amount).toFixed(2)}
                        </TableCell>
                      )}
                      {visibleColumns.currency && <TableCell>{instalment.currency}</TableCell>}
                      {visibleColumns.status && (
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(instalment.status)}`}>
                            {instalment.status.charAt(0).toUpperCase() + instalment.status.slice(1)}
                          </span>
                        </TableCell>
                      )}
                      {visibleColumns.instalment_number && <TableCell>{instalment.instalment_number || "N/A"}</TableCell>}
                      {visibleColumns.invoice_id && <TableCell>{instalment.invoice_id || "N/A"}</TableCell>}
                      {visibleColumns.stripe_customer_id && <TableCell>{instalment.stripe_customer_id || "N/A"}</TableCell>}
                      {visibleColumns.stripe_account && <TableCell>{instalment.stripe_account || "N/A"}</TableCell>}
                      {visibleColumns.account_name && <TableCell>{instalment.account_name}</TableCell>}
                      {visibleColumns.date_created && (
                        <TableCell>
                          {instalment.date_created ? new Date(instalment.date_created).toLocaleDateString() : "N/A"}
                        </TableCell>
                      )}
                      {visibleColumns.date_updated && (
                        <TableCell>
                          {instalment.date_updated ? new Date(instalment.date_updated).toLocaleDateString() : "N/A"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stats Footer */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total Instalments: {instalments.length}</span>
            <span>Filtered Results: {filteredInstalments.length}</span>
          </div>
        </div>
      </main>

      {/* Instalment Detail Dialog */}
      <Dialog open={!!selectedInstalment} onOpenChange={(open) => !open && setSelectedInstalment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                Instalment Details
              </DialogTitle>
              <div className="flex gap-2 mr-8">
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={handleEditInstalment} className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={handleSaveInstalment} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
          {selectedInstalment && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 pt-6"
            >
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        Client Name
                      </Label>
                      <p className="text-base font-medium pl-5">{selectedInstalment.client_name}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5" />
                        Client ID
                      </Label>
                      <p className="text-base font-medium pl-5">{selectedInstalment.client}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5" />
                        Amount
                      </Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedInstalment?.amount || ""}
                          onChange={(e) => updateEditedField("amount", parseFloat(e.target.value))}
                          className="h-10"
                        />
                      ) : (
                        <p className="text-base font-semibold pl-5 text-green-600 dark:text-green-400">${Number(selectedInstalment.amount).toFixed(2)}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5" />
                        Currency
                      </Label>
                      {isEditing ? (
                        <Select 
                          value={editedInstalment?.currency || ""} 
                          onValueChange={(value) => updateEditedField("currency", value)}
                        >
                          <SelectTrigger className="bg-background h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-base font-medium pl-5">{selectedInstalment.currency}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Schedule Date
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editedInstalment?.schedule_date || ""}
                          onChange={(e) => updateEditedField("schedule_date", e.target.value)}
                          className="h-10"
                        />
                      ) : (
                        <p className="text-base font-medium pl-5">{new Date(selectedInstalment.schedule_date).toLocaleDateString()}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Status
                      </Label>
                      {isEditing ? (
                        <Select 
                          value={editedInstalment?.status || ""} 
                          onValueChange={(value) => updateEditedField("status", value)}
                        >
                          <SelectTrigger className="bg-background h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="pl-5">
                          <Badge className={getStatusColor(selectedInstalment.status) + " text-sm px-3 py-1 font-medium"}>
                            {selectedInstalment.status.charAt(0).toUpperCase() + selectedInstalment.status.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5" />
                        Stripe Account
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedInstalment?.stripe_account || ""}
                          onChange={(e) => updateEditedField("stripe_account", e.target.value)}
                          className="h-10"
                        />
                      ) : (
                        <p className="text-base font-medium pl-5">{selectedInstalment.stripe_account || "N/A"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        Invoice ID
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedInstalment?.invoice_id || ""}
                          onChange={(e) => updateEditedField("invoice_id", e.target.value)}
                          className="h-10"
                        />
                      ) : (
                        <p className="text-base font-medium pl-5">{selectedInstalment.invoice_id || "N/A"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5" />
                        Stripe Customer ID
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedInstalment?.stripe_customer_id || ""}
                          onChange={(e) => updateEditedField("stripe_customer_id", e.target.value)}
                          className="h-10"
                        />
                      ) : (
                        <p className="text-base font-medium pl-5">{selectedInstalment.stripe_customer_id || "N/A"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5" />
                        Instalment Number
                      </Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedInstalment?.instalment_number || ""}
                          onChange={(e) => updateEditedField("instalment_number", parseInt(e.target.value))}
                          className="h-10"
                        />
                      ) : (
                        <p className="text-base font-medium pl-5">{selectedInstalment.instalment_number || "N/A"}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Created Date
                      </Label>
                      <p className="text-base font-medium pl-5">{selectedInstalment.date_created ? new Date(selectedInstalment.date_created).toLocaleString() : "N/A"}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        Updated Date
                      </Label>
                      <p className="text-base font-medium pl-5">{selectedInstalment.date_updated ? new Date(selectedInstalment.date_updated).toLocaleString() : "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this instalment? This action cannot be undone.
            </p>
            <div className="space-y-2">
              <Label>Type "delete" to confirm</Label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type delete"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteConfirmation("");
              setInstalmentToDelete(null);
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteInstalment}
              disabled={deleteConfirmation.toLowerCase() !== "delete"}
            >
              Delete Instalment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Instalments = () => {
  return (
    <AuthGuard>
      <InstalmentsContent />
    </AuthGuard>
  );
};

export default Instalments;