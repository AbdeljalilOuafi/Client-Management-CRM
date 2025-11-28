"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Filter, X, ChevronDown, CheckCircle2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { listPayments } from "@/lib/api/payments";
import { listClients } from "@/lib/api/clients";

export interface PaymentFilters {
  paymentMethod?: string[];
  minAmount?: number;
  maxAmount?: number;
  currency?: string[];
  status?: string[];
  startDate?: Date;
  endDate?: Date;
  failureReason?: string;
  clientName?: string[];
}

interface AdvancedPaymentFiltersProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
  onApply: () => void;
}

export const AdvancedPaymentFilters = ({
  filters,
  onFiltersChange,
  onApply,
}: AdvancedPaymentFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<PaymentFilters>(filters);
  const [open, setOpen] = useState(false);
  // Search states for multiselect dropdowns
  const [paymentMethodSearch, setPaymentMethodSearch] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [clientNameSearch, setClientNameSearch] = useState("");

  // Data lists for dropdowns
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [clientNames, setClientNames] = useState<string[]>([]);
  
  const statuses = ["Succeeded", "Failed", "Pending", "Refunded", "Disputed"];

  // Fetch unique values from payments
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const paymentsResponse = await listPayments({ page_size: 1000 });
        const payments = paymentsResponse.results;

        // Extract unique payment methods
        const uniquePaymentMethods = Array.from(
          new Set(payments.map(p => p.payment_method).filter(Boolean))
        ) as string[];
        setPaymentMethods(uniquePaymentMethods.sort());

        // Extract unique currencies
        const uniqueCurrencies = Array.from(
          new Set(payments.map(p => p.paid_currency).filter(Boolean))
        ) as string[];
        setCurrencies(uniqueCurrencies.sort());

        // Fetch clients for names
        const clientsResponse = await listClients({ page_size: 1000 });
        const uniqueClientNames = Array.from(
          new Set(
            clientsResponse.results.map(c => 
              c.last_name ? `${c.first_name} ${c.last_name}` : c.first_name
            ).filter(Boolean)
          )
        ).sort();
        setClientNames(uniqueClientNames);

      } catch (error) {
        console.error("Failed to fetch filter data:", error);
      }
    };

    fetchFilterData();
  }, []);

  const updateLocalFilter = <K extends keyof PaymentFilters>(
    key: K,
    value: PaymentFilters[K]
  ) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    setPaymentMethodSearch("");
    setCurrencySearch("");
    setStatusSearch("");
    setClientNameSearch("");
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onApply();
    setOpen(false);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)
  );

  // Filter functions for searchable dropdowns
  const getFilteredPaymentMethods = () => {
    if (!paymentMethodSearch) return paymentMethods;
    return paymentMethods.filter(method =>
      method.toLowerCase().includes(paymentMethodSearch.toLowerCase())
    );
  };

  const getFilteredCurrencies = () => {
    if (!currencySearch) return currencies;
    return currencies.filter(currency =>
      currency.toLowerCase().includes(currencySearch.toLowerCase())
    );
  };

  const getFilteredStatuses = () => {
    if (!statusSearch) return statuses;
    return statuses.filter(status =>
      status.toLowerCase().includes(statusSearch.toLowerCase())
    );
  };

  const getFilteredClientNames = () => {
    if (!clientNameSearch) return clientNames;
    return clientNames.filter(name =>
      name.toLowerCase().includes(clientNameSearch.toLowerCase())
    );
  };

  const activeFilterCount = Object.values(filters).filter(
    v => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="shadow-sm hover:shadow-md transition-all relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Apply advanced filters to refine your payment list
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6 [&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-200px)]" type="always">
          <div className="py-6 space-y-6 pr-4">
            
            {/* Payment Method Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account/Payment Method</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {localFilters.paymentMethod && localFilters.paymentMethod.length > 0
                        ? `${localFilters.paymentMethod.length} selected`
                        : "Select methods..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search methods..."
                      value={paymentMethodSearch}
                      onChange={(e) => setPaymentMethodSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {getFilteredPaymentMethods().length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No methods found
                      </p>
                    ) : (
                      getFilteredPaymentMethods().map((method) => {
                        const isSelected = localFilters.paymentMethod?.includes(method) || false;
                        return (
                          <button
                            key={method}
                            onClick={() => {
                              const current = localFilters.paymentMethod || [];
                              const newMethods = current.includes(method)
                                ? current.filter(m => m !== method)
                                : [...current, method];
                              updateLocalFilter("paymentMethod", newMethods.length > 0 ? newMethods : undefined);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm"
                          >
                            <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-primary border-primary' : 'border-input'
                            }`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span className="flex-1 text-left">{method}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {localFilters.paymentMethod && localFilters.paymentMethod.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.paymentMethod.map((method) => (
                    <span
                      key={method}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                    >
                      {method}
                      <button
                        onClick={() => {
                          const newMethods = localFilters.paymentMethod!.filter(m => m !== method);
                          updateLocalFilter("paymentMethod", newMethods.length > 0 ? newMethods : undefined);
                        }}
                        className="hover:bg-primary/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Amount Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minAmount || ""}
                  onChange={(e) => updateLocalFilter("minAmount", e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxAmount || ""}
                  onChange={(e) => updateLocalFilter("maxAmount", e.target.value ? Number(e.target.value) : undefined)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Currency Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currency</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {localFilters.currency && localFilters.currency.length > 0
                        ? `${localFilters.currency.length} selected`
                        : "Select currencies..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search currencies..."
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {getFilteredCurrencies().length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No currencies found
                      </p>
                    ) : (
                      getFilteredCurrencies().map((currency) => {
                        const isSelected = localFilters.currency?.includes(currency) || false;
                        return (
                          <button
                            key={currency}
                            onClick={() => {
                              const current = localFilters.currency || [];
                              const newCurrencies = current.includes(currency)
                                ? current.filter(c => c !== currency)
                                : [...current, currency];
                              updateLocalFilter("currency", newCurrencies.length > 0 ? newCurrencies : undefined);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm"
                          >
                            <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-primary border-primary' : 'border-input'
                            }`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span className="flex-1 text-left">{currency}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {localFilters.currency && localFilters.currency.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.currency.map((currency) => (
                    <span
                      key={currency}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                    >
                      {currency}
                      <button
                        onClick={() => {
                          const newCurrencies = localFilters.currency!.filter(c => c !== currency);
                          updateLocalFilter("currency", newCurrencies.length > 0 ? newCurrencies : undefined);
                        }}
                        className="hover:bg-primary/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {localFilters.status && localFilters.status.length > 0
                        ? `${localFilters.status.length} selected`
                        : "Select statuses..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search statuses..."
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {getFilteredStatuses().length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No statuses found
                      </p>
                    ) : (
                      getFilteredStatuses().map((status) => {
                        const isSelected = localFilters.status?.includes(status) || false;
                        return (
                          <button
                            key={status}
                            onClick={() => {
                              const current = localFilters.status || [];
                              const newStatuses = current.includes(status)
                                ? current.filter(s => s !== status)
                                : [...current, status];
                              updateLocalFilter("status", newStatuses.length > 0 ? newStatuses : undefined);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm"
                          >
                            <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-primary border-primary' : 'border-input'
                            }`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span className="flex-1 text-left">{status}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {localFilters.status && localFilters.status.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.status.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                    >
                      {status}
                      <button
                        onClick={() => {
                          const newStatuses = localFilters.status!.filter(s => s !== status);
                          updateLocalFilter("status", newStatuses.length > 0 ? newStatuses : undefined);
                        }}
                        className="hover:bg-primary/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.startDate ? format(localFilters.startDate, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.startDate}
                      onSelect={(date) => updateLocalFilter("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.endDate ? format(localFilters.endDate, "MMM d, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.endDate}
                      onSelect={(date) => updateLocalFilter("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Failure Reason Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Failure Reason</Label>
              <Input
                placeholder="Search by failure reason..."
                value={localFilters.failureReason || ""}
                onChange={(e) => updateLocalFilter("failureReason", e.target.value || undefined)}
              />
            </div>

            {/* Client Name Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Client Name</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {localFilters.clientName && localFilters.clientName.length > 0
                        ? `${localFilters.clientName.length} selected`
                        : "Select clients..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search clients..."
                      value={clientNameSearch}
                      onChange={(e) => setClientNameSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {getFilteredClientNames().length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No clients found
                      </p>
                    ) : (
                      getFilteredClientNames().map((name) => {
                        const isSelected = localFilters.clientName?.includes(name) || false;
                        return (
                          <button
                            key={name}
                            onClick={() => {
                              const current = localFilters.clientName || [];
                              const newNames = current.includes(name)
                                ? current.filter(n => n !== name)
                                : [...current, name];
                              updateLocalFilter("clientName", newNames.length > 0 ? newNames : undefined);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-sm"
                          >
                            <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-primary border-primary' : 'border-input'
                            }`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span className="flex-1 text-left">{name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {localFilters.clientName && localFilters.clientName.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.clientName.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                    >
                      {name}
                      <button
                        onClick={() => {
                          const newNames = localFilters.clientName!.filter(n => n !== name);
                          updateLocalFilter("clientName", newNames.length > 0 ? newNames : undefined);
                        }}
                        className="hover:bg-primary/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t gap-2 mt-auto">
          <Button variant="outline" onClick={clearAllFilters} className="flex-1">
            Clear All
          </Button>
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
