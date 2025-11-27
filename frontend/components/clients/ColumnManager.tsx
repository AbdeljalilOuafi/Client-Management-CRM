"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings2 } from "lucide-react";
import { clientColumnDefinitions } from "@/lib/clientColumnDefinitions";

interface ColumnManagerProps {
  visibleColumns: Record<string, boolean>;
  onVisibilityChange: (columnId: string, visible: boolean) => void;
}

export function ColumnManager({ visibleColumns, onVisibilityChange }: ColumnManagerProps) {
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Columns ({visibleCount})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Manage Columns</h4>
            <p className="text-xs text-muted-foreground">
              Show or hide columns in the table. Some columns cannot be hidden.
            </p>
          </div>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {clientColumnDefinitions.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`column-${column.id}`}
                    checked={visibleColumns[column.id] ?? column.defaultVisible}
                    onCheckedChange={(checked) => 
                      onVisibilityChange(column.id, checked as boolean)
                    }
                    disabled={column.mandatory}
                  />
                  <Label
                    htmlFor={`column-${column.id}`}
                    className={`text-sm cursor-pointer flex-1 ${
                      column.mandatory ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {column.label}
                    {column.mandatory && (
                      <span className="ml-2 text-xs text-muted-foreground">(Required)</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
