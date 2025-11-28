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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StaffFilters {
  name?: string[];
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  systemRole?: string[];
  jobTitle?: string[];
  appAccess?: string[];
  status?: string[];
  dateCreatedFrom?: Date;
  dateCreatedTo?: Date;
  dateUpdatedFrom?: Date;
  dateUpdatedTo?: Date;
}

interface AdvancedStaffFiltersProps {
  filters: StaffFilters;
  onFiltersChange: (filters: StaffFilters) => void;
  onApply: () => void;
}

export const AdvancedStaffFilters = ({
  filters,
  onFiltersChange,
  onApply,
}: AdvancedStaffFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<StaffFilters>(filters);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [systemRoles, setSystemRoles] = useState<string[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [nameSearch, setNameSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Fetch all filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { listEmployees } = await import("@/lib/api/staff");
        const response = await listEmployees();
        const employees = response.results || [];
        
        // Extract unique names
        const names = employees.map((emp: any) => emp.name).filter(Boolean);
        setStaffNames([...new Set(names)]);
        
        // Extract unique system roles
        const roles = employees.map((emp: any) => emp.role).filter(Boolean);
        setSystemRoles([...new Set(roles)]);
        
        // Extract unique job titles
        const titles = employees.map((emp: any) => emp.job_role).filter(Boolean);
        setJobTitles([...new Set(titles)]);
        
        // Extract unique statuses
        const statuses = employees.map((emp: any) => emp.status).filter(Boolean);
        setStatusOptions([...new Set(statuses)]);
        
      } catch (error) {
        console.error("Error fetching filter options:", error);
        setStaffNames([]);
        setSystemRoles([]);
        setJobTitles([]);
        setStatusOptions([]);
      }
    };
    
    fetchFilterOptions();
  }, []);

  const updateLocalFilter = (key: keyof StaffFilters, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof StaffFilters, value: string) => {
    const currentArray = (localFilters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    updateLocalFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onApply();
    setOpen(false); // Close the dialog after applying
  };

  const clearAllFilters = () => {
    const emptyFilters: StaffFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  }).length;

  // App Access options remain static as they're not stored in the database
  const appAccessOptions = ["full", "limited", "read_only"];

  const filteredStaffNames = staffNames.filter((name) =>
    name.toLowerCase().includes(nameSearch.toLowerCase())
  );

  // Helper function to format role/status names
  const formatLabel = (text: string) => {
    return text
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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
            Apply advanced filters to refine your staff list
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6 [&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-200px)]" type="always">
          <div className="py-6 space-y-6 pr-4">
            
            {/* Name Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {localFilters.name && localFilters.name.length > 0
                        ? `${localFilters.name.length} selected`
                        : "Select names..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search names..."
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <ScrollArea className="h-[200px]">
                    <div className="p-2 space-y-1">
                      {filteredStaffNames.map((name) => (
                        <button
                          key={name}
                          onClick={() => toggleArrayFilter("name", name)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted",
                            localFilters.name?.includes(name) && "bg-muted"
                          )}
                        >
                          <CheckCircle2
                            className={cn(
                              "h-4 w-4",
                              localFilters.name?.includes(name)
                                ? "text-primary"
                                : "text-transparent"
                            )}
                          />
                          {name}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {localFilters.name && localFilters.name.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.name.map((name) => (
                    <Badge key={name} variant="secondary" className="gap-1">
                      {name}
                      <button
                        onClick={() => toggleArrayFilter("name", name)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Start Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.startDateFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.startDateFrom ? format(localFilters.startDateFrom, "PPP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.startDateFrom}
                      onSelect={(date: Date | undefined) => updateLocalFilter("startDateFrom", date)}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.startDateTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.startDateTo ? format(localFilters.startDateTo, "PPP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.startDateTo}
                      onSelect={(date: Date | undefined) => updateLocalFilter("startDateTo", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* End Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.endDateFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.endDateFrom ? format(localFilters.endDateFrom, "PPP") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.endDateFrom}
                      onSelect={(date: Date | undefined) => updateLocalFilter("endDateFrom", date)}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.endDateTo && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.endDateTo ? format(localFilters.endDateTo, "PPP") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.endDateTo}
                      onSelect={(date: Date | undefined) => updateLocalFilter("endDateTo", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* System Role Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">System Role</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {localFilters.systemRole && localFilters.systemRole.length > 0
                        ? `${localFilters.systemRole.length} selected`
                        : "Select roles..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2" align="start">
                  <div className="space-y-1">
                    {systemRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => toggleArrayFilter("systemRole", role)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted",
                          localFilters.systemRole?.includes(role) && "bg-muted"
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "h-4 w-4",
                            localFilters.systemRole?.includes(role)
                              ? "text-primary"
                              : "text-transparent"
                          )}
                        />
                        {formatLabel(role)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {localFilters.systemRole && localFilters.systemRole.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.systemRole.map((role) => (
                    <Badge key={role} variant="secondary" className="gap-1">
                      {formatLabel(role)}
                      <button
                        onClick={() => toggleArrayFilter("systemRole", role)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Job Title Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Job Title</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {localFilters.jobTitle && localFilters.jobTitle.length > 0
                        ? `${localFilters.jobTitle.length} selected`
                        : "Select job titles..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2" align="start">
                  <div className="space-y-1">
                    {jobTitles.map((title) => (
                      <button
                        key={title}
                        onClick={() => toggleArrayFilter("jobTitle", title)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted",
                          localFilters.jobTitle?.includes(title) && "bg-muted"
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "h-4 w-4",
                            localFilters.jobTitle?.includes(title)
                              ? "text-primary"
                              : "text-transparent"
                          )}
                        />
                        {title}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {localFilters.jobTitle && localFilters.jobTitle.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.jobTitle.map((title) => (
                    <Badge key={title} variant="secondary" className="gap-1">
                      {title}
                      <button
                        onClick={() => toggleArrayFilter("jobTitle", title)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* App Access Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">App Access</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal"
                  >
                    <span className="truncate">
                      {localFilters.appAccess && localFilters.appAccess.length > 0
                        ? `${localFilters.appAccess.length} selected`
                        : "Select access levels..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2" align="start">
                  <div className="space-y-1">
                    {appAccessOptions.map((access) => (
                      <button
                        key={access}
                        onClick={() => toggleArrayFilter("appAccess", access)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted",
                          localFilters.appAccess?.includes(access) && "bg-muted"
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "h-4 w-4",
                            localFilters.appAccess?.includes(access)
                              ? "text-primary"
                              : "text-transparent"
                          )}
                        />
                        {formatLabel(access)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {localFilters.appAccess && localFilters.appAccess.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.appAccess.map((access) => (
                    <Badge key={access} variant="secondary" className="gap-1">
                      {formatLabel(access)}
                      <button
                        onClick={() => toggleArrayFilter("appAccess", access)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
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
                        : "Select status..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2" align="start">
                  <div className="space-y-1">
                    {statusOptions.map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleArrayFilter("status", status)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted",
                          localFilters.status?.includes(status) && "bg-muted"
                        )}
                      >
                        <CheckCircle2
                          className={cn(
                            "h-4 w-4",
                            localFilters.status?.includes(status)
                              ? "text-primary"
                              : "text-transparent"
                          )}
                        />
                        {formatLabel(status)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {localFilters.status && localFilters.status.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {localFilters.status.map((status) => (
                    <Badge key={status} variant="secondary" className="gap-1">
                      {formatLabel(status)}
                      <button
                        onClick={() => toggleArrayFilter("status", status)}
                        className="ml-1 hover:bg-muted rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Created Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Created Date</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.dateCreatedFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateCreatedFrom ? format(localFilters.dateCreatedFrom, "PPP") : "From"}
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
                      {localFilters.dateCreatedTo ? format(localFilters.dateCreatedTo, "PPP") : "To"}
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

            {/* Updated Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Updated Date</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start text-left font-normal", !localFilters.dateUpdatedFrom && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateUpdatedFrom ? format(localFilters.dateUpdatedFrom, "PPP") : "From"}
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
                      {localFilters.dateUpdatedTo ? format(localFilters.dateUpdatedTo, "PPP") : "To"}
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
