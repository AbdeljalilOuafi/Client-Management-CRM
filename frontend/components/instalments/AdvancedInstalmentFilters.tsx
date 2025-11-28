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
import { listInstalments } from "@/lib/api/instalments";
import { listClients } from "@/lib/api/clients";
import { cn } from "@/lib/utils";

export interface InstalmentFilters {
  scheduleDateFrom?: Date;
  scheduleDateTo?: Date;
  stripeAccount?: string[];
  minAmount?: number;
  maxAmount?: number;
  currency?: string[];
  status?: string[];
  dateCreatedFrom?: Date;
  dateCreatedTo?: Date;
  clientName?: string[];
  stripeCustomerId?: string;
  dateUpdatedFrom?: Date;
  dateUpdatedTo?: Date;
}

interface AdvancedInstalmentFiltersProps {
  filters: InstalmentFilters;
  onFiltersChange: (filters: InstalmentFilters) => void;
  onApply: () => void;
}

export const AdvancedInstalmentFilters = ({
  filters,
  onFiltersChange,
  onApply,
}: AdvancedInstalmentFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<InstalmentFilters>(filters);
  const [open, setOpen] = useState(false);
  
  // Search states for multiselect dropdowns
  const [stripeAccountSearch, setStripeAccountSearch] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [clientNameSearch, setClientNameSearch] = useState("");

  // Data lists for dropdowns
  const [stripeAccounts, setStripeAccounts] = useState<string[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [clientNames, setClientNames] = useState<string[]>([]);
  
  const statuses = ["open", "paid", "failed", "closed"];

  // Fetch unique values from instalments
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const instalmentsResponse = await listInstalments({ page_size: 1000 });
        const instalments = instalmentsResponse.results;

        // Extract unique stripe accounts
        const uniqueStripeAccounts = Array.from(
          new Set(instalments.map(i => i.stripe_account).filter(Boolean))
        ) as string[];
        setStripeAccounts(uniqueStripeAccounts.sort());

        // Extract unique currencies
        const uniqueCurrencies = Array.from(
          new Set(instalments.map(i => i.currency).filter(Boolean))
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

  const updateLocalFilter = <K extends keyof InstalmentFilters>(
    key: K,
    value: InstalmentFilters[K]
  ) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    setStripeAccountSearch("");
    setCurrencySearch("");
    setStatusSearch("");
    setClientNameSearch("");
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onApply();
    setOpen(false);
  };

  // Filter functions for searchable dropdowns
  const getFilteredStripeAccounts = () => {
    if (!stripeAccountSearch) return stripeAccounts;
    return stripeAccounts.filter(account =>
      account.toLowerCase().includes(stripeAccountSearch.toLowerCase())
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
            Apply advanced filters to refine your instalment list
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6 [&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-200px)]" type="always">
          <div className="py-6 space-y-6 pr-4">
            
            {/* Schedule Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Schedule Date</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.scheduleDateFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.scheduleDateFrom ? format(localFilters.scheduleDateFrom, "PP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.scheduleDateFrom}
                      onSelect={(date: Date | undefined) => updateLocalFilter("scheduleDateFrom", date)}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.scheduleDateTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.scheduleDateTo ? format(localFilters.scheduleDateTo, "PP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.scheduleDateTo}
                      onSelect={(date: Date | undefined) => updateLocalFilter("scheduleDateTo", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* Stripe Account Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stripe Account</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    {localFilters.stripeAccount && localFilters.stripeAccount.length > 0
                      ? `${localFilters.stripeAccount.length} selected`
                      : "Select accounts"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search accounts..."
                      value={stripeAccountSearch}
                      onChange={(e) => setStripeAccountSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {getFilteredStripeAccounts().map((account) => (
                      <div
                        key={account}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => {
                          const current = localFilters.stripeAccount || [];
                          const newAccounts = current.includes(account)
                            ? current.filter(a => a !== account)
                            : [...current, account];
                          updateLocalFilter("stripeAccount", newAccounts.length > 0 ? newAccounts : undefined);
                        }}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded flex items-center justify-center",
                          localFilters.stripeAccount?.includes(account) && "bg-primary border-primary"
                        )}>
                          {localFilters.stripeAccount?.includes(account) && (
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{account}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minAmount || ""}
                  onChange={(e) => updateLocalFilter("minAmount", e.target.value ? Number(e.target.value) : undefined)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxAmount || ""}
                  onChange={(e) => updateLocalFilter("maxAmount", e.target.value ? Number(e.target.value) : undefined)}
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
                    {localFilters.currency && localFilters.currency.length > 0
                      ? `${localFilters.currency.length} selected`
                      : "Select currencies"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search currencies..."
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {getFilteredCurrencies().map((currency) => (
                      <div
                        key={currency}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => {
                          const current = localFilters.currency || [];
                          const newCurrencies = current.includes(currency)
                            ? current.filter(c => c !== currency)
                            : [...current, currency];
                          updateLocalFilter("currency", newCurrencies.length > 0 ? newCurrencies : undefined);
                        }}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded flex items-center justify-center",
                          localFilters.currency?.includes(currency) && "bg-primary border-primary"
                        )}>
                          {localFilters.currency?.includes(currency) && (
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{currency}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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
                    {localFilters.status && localFilters.status.length > 0
                      ? `${localFilters.status.length} selected`
                      : "Select statuses"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search statuses..."
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {getFilteredStatuses().map((status) => (
                      <div
                        key={status}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => {
                          const current = localFilters.status || [];
                          const newStatuses = current.includes(status)
                            ? current.filter(s => s !== status)
                            : [...current, status];
                          updateLocalFilter("status", newStatuses.length > 0 ? newStatuses : undefined);
                        }}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded flex items-center justify-center",
                          localFilters.status?.includes(status) && "bg-primary border-primary"
                        )}>
                          {localFilters.status?.includes(status) && (
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm capitalize">{status}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Date Created Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Created</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.dateCreatedFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateCreatedFrom ? format(localFilters.dateCreatedFrom, "PP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateCreatedFrom}
                      onSelect={(date: Date | undefined) => updateLocalFilter("dateCreatedFrom", date)}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.dateCreatedTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateCreatedTo ? format(localFilters.dateCreatedTo, "PP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateCreatedTo}
                      onSelect={(date: Date | undefined) => updateLocalFilter("dateCreatedTo", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
                    {localFilters.clientName && localFilters.clientName.length > 0
                      ? `${localFilters.clientName.length} selected`
                      : "Select clients"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search clients..."
                      value={clientNameSearch}
                      onChange={(e) => setClientNameSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-2">
                    {getFilteredClientNames().map((name) => (
                      <div
                        key={name}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => {
                          const current = localFilters.clientName || [];
                          const newNames = current.includes(name)
                            ? current.filter(n => n !== name)
                            : [...current, name];
                          updateLocalFilter("clientName", newNames.length > 0 ? newNames : undefined);
                        }}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded flex items-center justify-center",
                          localFilters.clientName?.includes(name) && "bg-primary border-primary"
                        )}>
                          {localFilters.clientName?.includes(name) && (
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Stripe Customer ID */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stripe Customer ID</Label>
              <Input
                placeholder="Enter Stripe Customer ID"
                value={localFilters.stripeCustomerId || ""}
                onChange={(e) => updateLocalFilter("stripeCustomerId", e.target.value || undefined)}
              />
            </div>

            {/* Date Updated Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Updated</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.dateUpdatedFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateUpdatedFrom ? format(localFilters.dateUpdatedFrom, "PP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateUpdatedFrom}
                      onSelect={(date: Date | undefined) => updateLocalFilter("dateUpdatedFrom", date)}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.dateUpdatedTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateUpdatedTo ? format(localFilters.dateUpdatedTo, "PP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateUpdatedTo}
                      onSelect={(date: Date | undefined) => updateLocalFilter("dateUpdatedTo", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
