"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { EmployeeRole, listEmployeeRoles } from "@/lib/api/staff";

interface CustomRolesMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function CustomRolesMultiSelect({ value, onChange, disabled }: CustomRolesMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Fetch roles when search query changes
  useEffect(() => {
    if (open) {
      fetchRoles(debouncedSearch);
    }
  }, [debouncedSearch, open]);

  const fetchRoles = async (search?: string) => {
    try {
      setLoading(true);
      const response = await listEmployeeRoles({ 
        is_active: true, 
        ordering: "name",
        ...(search && { search })
      });
      setRoles(response.results);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (roleId: string) => {
    const newValue = value.includes(roleId)
      ? value.filter((id) => id !== roleId)
      : [...value, roleId];
    onChange(newValue);
  };

  const selectedRoles = roles.filter((role) => value.includes(role.id));

  // Clear search when popover closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedRoles.length === 0 ? (
              <span className="text-muted-foreground">Select roles...</span>
            ) : (
              selectedRoles.map((role) => (
                <Badge
                  key={role.id}
                  style={{
                    backgroundColor: role.color,
                    color: "white",
                  }}
                  className="text-xs"
                >
                  {role.name}
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search roles..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching roles...</span>
              </div>
            ) : (
              <div className="py-6 text-center text-sm">
                No roles found.
              </div>
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {loading && roles.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading roles...</span>
              </div>
            ) : (
              roles.map((role) => (
                <CommandItem
                  key={role.id}
                  onSelect={() => toggleRole(role.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(role.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <span>{role.name}</span>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
