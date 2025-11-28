"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Filter, CalendarIcon, X, ChevronDown, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { listCoaches, listClosers, listSetters, Employee } from "@/lib/api/staff";

export interface ClientFilters {
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  coach?: string[];
  closer?: string[];
  setter?: string[];
  packageStartDateFrom?: string;
  packageStartDateTo?: string;
  packageEndDateFrom?: string;
  packageEndDateTo?: string;
  ltvMin?: number;
  ltvMax?: number;
  latestPaymentDateFrom?: string;
  latestPaymentDateTo?: string;
  hadPaymentsFrom?: string;
  hadPaymentsTo?: string;
  givenNotice?: string;
  packageType?: string[];
  status?: string;
  checkinDay?: string[];
  stripeAccount?: string[];
  country?: string[];
}

interface AdvancedClientFiltersProps {
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
  onApply: () => void;
}

export function AdvancedClientFilters({
  filters,
  onFiltersChange,
  onApply,
}: AdvancedClientFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ClientFilters>(filters);
  const [open, setOpen] = useState(false);
  const [coaches, setCoaches] = useState<Employee[]>([]);
  const [closers, setClosers] = useState<Employee[]>([]);
  const [setters, setSetters] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [coachSearch, setCoachSearch] = useState("");
  const [closerSearch, setCloserSearch] = useState("");
  const [setterSearch, setSetterSearch] = useState("");
  const [packageTypeSearch, setPackageTypeSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [stripeAccountSearch, setStripeAccountSearch] = useState("");
  
  // Data lists
  const [packageTypes, setPackageTypes] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [stripeAccounts, setStripeAccounts] = useState<string[]>([]);
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Fetch coaches, closers, setters, and unique values when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [coachesData, closersData, settersData] = await Promise.all([
          listCoaches(),
          listClosers(),
          listSetters(),
        ]);
        setCoaches(coachesData);
        setClosers(closersData);
        setSetters(settersData);
        
        // Fetch all clients to extract unique values
        const { listClients } = await import("@/lib/api/clients");
        const clientsResponse = await listClients({ page_size: 1000 });
        const clients = clientsResponse.results;
        
        // Extract unique package types
        const uniquePackageTypes = Array.from(new Set(
          clients.map(c => c.package_type).filter(Boolean)
        )) as string[];
        setPackageTypes(uniquePackageTypes.sort());
        
        // Extract unique countries
        const uniqueCountries = Array.from(new Set(
          clients.map(c => c.country).filter(Boolean)
        )) as string[];
        setCountries(uniqueCountries.sort());
        
        // Extract unique stripe accounts/payment methods
        const uniqueStripeAccounts = Array.from(new Set(
          clients.map(c => c.payment_method).filter(Boolean)
        )) as string[];
        setStripeAccounts(uniqueStripeAccounts.sort());
        
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeFilterCount = Object.values(localFilters).filter(v => 
    v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  const handleClearAll = () => {
    const clearedFilters: ClientFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    setOpen(false);
  };

  const updateFilter = (key: keyof ClientFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Apply advanced filters to refine your client list
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6 [&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-200px)]" type="always">
          <div className="py-6 space-y-6 pr-4">
            {/* Date Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Date Ranges</h3>
              
              {/* Start Date Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.startDateFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.startDateFrom ? format(new Date(localFilters.startDateFrom), "PP") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.startDateFrom ? new Date(localFilters.startDateFrom) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("startDateFrom", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.startDateTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.startDateTo ? format(new Date(localFilters.startDateTo), "PP") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.startDateTo ? new Date(localFilters.startDateTo) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("startDateTo", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* End Date Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.endDateFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.endDateFrom ? format(new Date(localFilters.endDateFrom), "PP") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.endDateFrom ? new Date(localFilters.endDateFrom) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("endDateFrom", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.endDateTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.endDateTo ? format(new Date(localFilters.endDateTo), "PP") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.endDateTo ? new Date(localFilters.endDateTo) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("endDateTo", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Latest Payment Date Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Latest Payment Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.latestPaymentDateFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.latestPaymentDateFrom ? format(new Date(localFilters.latestPaymentDateFrom), "PP") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.latestPaymentDateFrom ? new Date(localFilters.latestPaymentDateFrom) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("latestPaymentDateFrom", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.latestPaymentDateTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.latestPaymentDateTo ? format(new Date(localFilters.latestPaymentDateTo), "PP") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.latestPaymentDateTo ? new Date(localFilters.latestPaymentDateTo) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("latestPaymentDateTo", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Current Package Start Date Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Current Package Start Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.packageStartDateFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.packageStartDateFrom ? format(new Date(localFilters.packageStartDateFrom), "PP") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.packageStartDateFrom ? new Date(localFilters.packageStartDateFrom) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("packageStartDateFrom", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.packageStartDateTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.packageStartDateTo ? format(new Date(localFilters.packageStartDateTo), "PP") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.packageStartDateTo ? new Date(localFilters.packageStartDateTo) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("packageStartDateTo", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Current Package End Date Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Current Package End Date</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.packageEndDateFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.packageEndDateFrom ? format(new Date(localFilters.packageEndDateFrom), "PP") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.packageEndDateFrom ? new Date(localFilters.packageEndDateFrom) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("packageEndDateFrom", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.packageEndDateTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.packageEndDateTo ? format(new Date(localFilters.packageEndDateTo), "PP") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.packageEndDateTo ? new Date(localFilters.packageEndDateTo) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("packageEndDateTo", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Had Payments Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Had Payments</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.hadPaymentsFrom && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.hadPaymentsFrom ? format(new Date(localFilters.hadPaymentsFrom), "PP") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.hadPaymentsFrom ? new Date(localFilters.hadPaymentsFrom) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("hadPaymentsFrom", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !localFilters.hadPaymentsTo && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.hadPaymentsTo ? format(new Date(localFilters.hadPaymentsTo), "PP") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.hadPaymentsTo ? new Date(localFilters.hadPaymentsTo) : undefined}
                        onSelect={(date: Date | undefined) => updateFilter("hadPaymentsTo", date ? format(date, "yyyy-MM-dd") : undefined)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Separator />

            {/* Team Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Team Assignment</h3>
              
              {/* Coach */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Coach</Label>
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading coaches...</p>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-sm">
                        {localFilters.coach && localFilters.coach.length > 0
                          ? `${localFilters.coach.length} selected`
                          : "Select coaches"}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search coaches..."
                          value={coachSearch}
                          onChange={(e) => setCoachSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-2">
                        {coaches.length > 0 ? (
                          coaches
                            .filter(coach => 
                              coach.name.toLowerCase().includes(coachSearch.toLowerCase())
                            )
                            .map((coach) => (
                              <div
                                key={coach.id}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => {
                                  const currentCoaches = localFilters.coach || [];
                                  const coachId = coach.id.toString();
                                  const newCoaches = currentCoaches.includes(coachId)
                                    ? currentCoaches.filter(id => id !== coachId)
                                    : [...currentCoaches, coachId];
                                  updateFilter("coach", newCoaches.length > 0 ? newCoaches : undefined);
                                }}
                              >
                                <div className={cn(
                                  "h-4 w-4 border rounded flex items-center justify-center",
                                  localFilters.coach?.includes(coach.id.toString()) && "bg-primary border-primary"
                                )}>
                                  {localFilters.coach?.includes(coach.id.toString()) && (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span className="text-sm">{coach.name}</span>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground p-2">No coaches found</p>
                        )}
                        {coaches.length > 0 && coaches.filter(coach => 
                          coach.name.toLowerCase().includes(coachSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">No matches found</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Closer */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Closer</Label>
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading closers...</p>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-sm">
                        {localFilters.closer && localFilters.closer.length > 0
                          ? `${localFilters.closer.length} selected`
                          : "Select closers"}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search closers..."
                          value={closerSearch}
                          onChange={(e) => setCloserSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-2">
                        {closers.length > 0 ? (
                          closers
                            .filter(closer => 
                              closer.name.toLowerCase().includes(closerSearch.toLowerCase())
                            )
                            .map((closer) => (
                              <div
                                key={closer.id}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => {
                                  const currentClosers = localFilters.closer || [];
                                  const closerId = closer.id.toString();
                                  const newClosers = currentClosers.includes(closerId)
                                    ? currentClosers.filter(id => id !== closerId)
                                    : [...currentClosers, closerId];
                                  updateFilter("closer", newClosers.length > 0 ? newClosers : undefined);
                                }}
                              >
                                <div className={cn(
                                  "h-4 w-4 border rounded flex items-center justify-center",
                                  localFilters.closer?.includes(closer.id.toString()) && "bg-primary border-primary"
                                )}>
                                  {localFilters.closer?.includes(closer.id.toString()) && (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span className="text-sm">{closer.name}</span>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground p-2">No closers found</p>
                        )}
                        {closers.length > 0 && closers.filter(closer => 
                          closer.name.toLowerCase().includes(closerSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">No matches found</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Setter */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Setter</Label>
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading setters...</p>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-sm">
                        {localFilters.setter && localFilters.setter.length > 0
                          ? `${localFilters.setter.length} selected`
                          : "Select setters"}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search setters..."
                          value={setterSearch}
                          onChange={(e) => setSetterSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-2">
                        {setters.length > 0 ? (
                          setters
                            .filter(setter => 
                              setter.name.toLowerCase().includes(setterSearch.toLowerCase())
                            )
                            .map((setter) => (
                              <div
                                key={setter.id}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => {
                                  const currentSetters = localFilters.setter || [];
                                  const setterId = setter.id.toString();
                                  const newSetters = currentSetters.includes(setterId)
                                    ? currentSetters.filter(id => id !== setterId)
                                    : [...currentSetters, setterId];
                                  updateFilter("setter", newSetters.length > 0 ? newSetters : undefined);
                                }}
                              >
                                <div className={cn(
                                  "h-4 w-4 border rounded flex items-center justify-center",
                                  localFilters.setter?.includes(setter.id.toString()) && "bg-primary border-primary"
                                )}>
                                  {localFilters.setter?.includes(setter.id.toString()) && (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span className="text-sm">{setter.name}</span>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground p-2">No setters found</p>
                        )}
                        {setters.length > 0 && setters.filter(setter => 
                          setter.name.toLowerCase().includes(setterSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">No matches found</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <Separator />

            {/* Status & Package Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Status & Package</h3>
              
              {/* Status */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={localFilters.status} onValueChange={(value) => updateFilter("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Given Notice */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Given Notice</Label>
                <Select value={localFilters.givenNotice} onValueChange={(value) => updateFilter("givenNotice", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Package Type */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Package Type</Label>
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-sm">
                        {localFilters.packageType && localFilters.packageType.length > 0
                          ? `${localFilters.packageType.length} selected`
                          : "Select package types"}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search package types..."
                          value={packageTypeSearch}
                          onChange={(e) => setPackageTypeSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-2">
                        {packageTypes.length > 0 ? (
                          packageTypes
                            .filter(type => 
                              type.toLowerCase().includes(packageTypeSearch.toLowerCase())
                            )
                            .map((type) => (
                              <div
                                key={type}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => {
                                  const current = localFilters.packageType || [];
                                  const newTypes = current.includes(type)
                                    ? current.filter(t => t !== type)
                                    : [...current, type];
                                  updateFilter("packageType", newTypes.length > 0 ? newTypes : undefined);
                                }}
                              >
                                <div className={cn(
                                  "h-4 w-4 border rounded flex items-center justify-center",
                                  localFilters.packageType?.includes(type) && "bg-primary border-primary"
                                )}>
                                  {localFilters.packageType?.includes(type) && (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span className="text-sm">{type}</span>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground p-2">No package types found</p>
                        )}
                        {packageTypes.length > 0 && packageTypes.filter(type => 
                          type.toLowerCase().includes(packageTypeSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">No matches found</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Check-in Day */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Check-in Day</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between text-sm">
                      {localFilters.checkinDay && localFilters.checkinDay.length > 0
                        ? `${localFilters.checkinDay.length} selected`
                        : "Select days"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="max-h-[250px] overflow-y-auto p-2">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                          onClick={() => {
                            const current = localFilters.checkinDay || [];
                            const newDays = current.includes(day)
                              ? current.filter(d => d !== day)
                              : [...current, day];
                            updateFilter("checkinDay", newDays.length > 0 ? newDays : undefined);
                          }}
                        >
                          <div className={cn(
                            "h-4 w-4 border rounded flex items-center justify-center",
                            localFilters.checkinDay?.includes(day) && "bg-primary border-primary"
                          )}>
                            {localFilters.checkinDay?.includes(day) && (
                              <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <span className="text-sm">{day}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* Number Range Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Number Ranges</h3>
              
              {/* LTV Range */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">LTV (Lifetime Value)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.ltvMin || ""}
                    onChange={(e) => updateFilter("ltvMin", e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.ltvMax || ""}
                    onChange={(e) => updateFilter("ltvMax", e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Location & Payment Filters */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Location & Payment</h3>
              
              {/* Country */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Country</Label>
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-sm">
                        {localFilters.country && localFilters.country.length > 0
                          ? `${localFilters.country.length} selected`
                          : "Select countries"}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search countries..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-2">
                        {countries.length > 0 ? (
                          countries
                            .filter(country => 
                              country.toLowerCase().includes(countrySearch.toLowerCase())
                            )
                            .map((country) => (
                              <div
                                key={country}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => {
                                  const current = localFilters.country || [];
                                  const newCountries = current.includes(country)
                                    ? current.filter(c => c !== country)
                                    : [...current, country];
                                  updateFilter("country", newCountries.length > 0 ? newCountries : undefined);
                                }}
                              >
                                <div className={cn(
                                  "h-4 w-4 border rounded flex items-center justify-center",
                                  localFilters.country?.includes(country) && "bg-primary border-primary"
                                )}>
                                  {localFilters.country?.includes(country) && (
                                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span className="text-sm">{country}</span>
                              </div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground p-2">No countries found</p>
                        )}
                        {countries.length > 0 && countries.filter(country => 
                          country.toLowerCase().includes(countrySearch.toLowerCase())
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">No matches found</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Stripe Account */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Stripe Account</Label>
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between text-sm">
                        {localFilters.stripeAccount && localFilters.stripeAccount.length > 0
                          ? `${localFilters.stripeAccount.length} selected`
                          : "Select Stripe accounts"}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search Stripe accounts..."
                          value={stripeAccountSearch}
                          onChange={(e) => setStripeAccountSearch(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto p-2">
                        {stripeAccounts.length > 0 ? (
                          stripeAccounts
                            .filter(account => 
                              account.toLowerCase().includes(stripeAccountSearch.toLowerCase())
                            )
                            .map((account) => (
                              <div
                                key={account}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => {
                                  const current = localFilters.stripeAccount || [];
                                  const newAccounts = current.includes(account)
                                    ? current.filter(a => a !== account)
                                    : [...current, account];
                                  updateFilter("stripeAccount", newAccounts.length > 0 ? newAccounts : undefined);
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
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground p-2">No Stripe accounts found</p>
                        )}
                        {stripeAccounts.length > 0 && stripeAccounts.filter(account => 
                          account.toLowerCase().includes(stripeAccountSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">No matches found</p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t gap-2 mt-auto">
          <Button variant="outline" onClick={handleClearAll} className="flex-1">
            Clear All
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
