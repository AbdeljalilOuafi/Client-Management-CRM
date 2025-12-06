"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Scale, Zap, Dumbbell, MessageSquare, Target, User, Mail, Package, Send, Monitor, Smartphone } from "lucide-react";
import { getCheckInForm, CheckInForm, CheckInFormField } from "@/lib/api/checkin-forms";
import { cn } from "@/lib/utils";

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
}

type ViewMode = "desktop" | "mobile";

export function FormPreviewDialog({ open, onOpenChange, formId }: FormPreviewDialogProps) {
  const [form, setForm] = useState<CheckInForm | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  useEffect(() => {
    if (open && formId) {
      loadForm();
    }
  }, [open, formId]);

  const loadForm = async () => {
    try {
      setIsLoading(true);
      const data = await getCheckInForm(formId);
      setForm(data);
      setFormValues({});
    } catch (error) {
      console.error("Failed to load form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Get icon for field
  const getFieldIcon = (fieldId: string) => {
    const iconMap: Record<string, any> = {
      weight: Scale,
      energy_level: Zap,
      workouts_completed: Dumbbell,
      challenges: MessageSquare,
      goals: Target,
    };
    return iconMap[fieldId] || null;
  };

  const renderField = (field: CheckInFormField) => {
    const value = formValues[field.id] || "";
    const FieldIcon = getFieldIcon(field.id);

    switch (field.type) {
      case "number":
        return (
          <div key={field.id} className="space-y-2.5">
            <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              {FieldIcon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <FieldIcon className="h-5 w-5" />
                </div>
              )}
              <Input
                id={field.id}
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                onKeyDown={(e) => {
                  // Only allow: digits, backspace, delete, tab, escape, enter, decimal point, minus, arrow keys for cursor
                  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', '.', '-'];
                  if (allowedKeys.includes(e.key)) return;
                  // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                  // Block if not a digit
                  if (!/^\d$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                min={field.min}
                max={field.max}
                className={`rounded-xl border-input ${FieldIcon ? 'pl-12' : 'pl-4'} pr-4 py-6 text-base transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
            </div>
          </div>
        );

      case "select":
        // Check if this is a multiple selection (checkboxes) or single selection (dropdown)
        const allowMultiple = (field as any).allow_multiple || false;
        const allowOther = (field as any).allow_other || false;
        const otherValue = formValues[`${field.id}_other`] || "";
        
        if (allowMultiple) {
          // Render as checkboxes for multiple selection
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div key={field.id} className="space-y-3">
              <Label className="text-sm font-semibold text-card-foreground">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-input hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`${field.id}-${option}`}
                      checked={selectedValues.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFieldChange(field.id, [...selectedValues, option]);
                        } else {
                          handleFieldChange(field.id, selectedValues.filter((v: string) => v !== option));
                        }
                      }}
                    />
                    <Label htmlFor={`${field.id}-${option}`} className="text-base cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                ))}
                {allowOther && (
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-input hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`${field.id}-other`}
                      checked={selectedValues.includes("_other")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleFieldChange(field.id, [...selectedValues, "_other"]);
                        } else {
                          handleFieldChange(field.id, selectedValues.filter((v: string) => v !== "_other"));
                        }
                      }}
                    />
                    <Label htmlFor={`${field.id}-other`} className="text-base cursor-pointer">
                      Other:
                    </Label>
                    <Input
                      value={otherValue}
                      onChange={(e) => handleFieldChange(`${field.id}_other`, e.target.value)}
                      placeholder="Please specify..."
                      className="flex-1 h-8"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          // Render as dropdown for single selection
          return (
            <div key={field.id} className="space-y-2.5">
              <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
                <SelectTrigger 
                  id={field.id} 
                  className="rounded-xl border-input pl-4 pr-4 h-14 text-base transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option} className="text-base py-3">
                      {option}
                    </SelectItem>
                  ))}
                  {allowOther && (
                    <SelectItem value="_other" className="text-base py-3">
                      Other...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {allowOther && value === "_other" && (
                <Input
                  value={otherValue}
                  onChange={(e) => handleFieldChange(`${field.id}_other`, e.target.value)}
                  placeholder="Please specify..."
                  className="rounded-xl border-input pl-4 pr-4 py-6 text-base mt-2"
                />
              )}
            </div>
          );
        }

      case "textarea":
        return (
          <div key={field.id} className="space-y-2.5">
            <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              {FieldIcon && (
                <div className="absolute left-4 top-4 text-muted-foreground">
                  <FieldIcon className="h-5 w-5" />
                </div>
              )}
              <Textarea
                id={field.id}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                className={`min-h-[120px] rounded-xl border-input ${FieldIcon ? 'pl-12' : 'pl-4'} pr-4 py-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent resize-none`}
              />
            </div>
          </div>
        );

      case "text":
      default:
        return (
          <div key={field.id} className="space-y-2.5">
            <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              {FieldIcon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <FieldIcon className="h-5 w-5" />
                </div>
              )}
              <Input
                id={field.id}
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                className={`rounded-xl border-input ${FieldIcon ? 'pl-12' : 'pl-4'} pr-4 py-6 text-base transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent`}
              />
            </div>
          </div>
        );
    }
  };

  // Group fields by category
  const groupFields = () => {
    const fields = form?.form_schema?.fields || [];
    const recap = fields.filter(f => 
      ['weight', 'energy_level', 'workouts_completed'].includes(f.id)
    );
    const feedback = fields.filter(f => 
      ['challenges', 'goals'].includes(f.id)
    );
    const other = fields.filter(f => 
      !['weight', 'energy_level', 'workouts_completed', 'challenges', 'goals'].includes(f.id)
    );
    
    return { recap, feedback, other };
  };

  const { recap, feedback, other } = groupFields();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Form Preview</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                This is how clients will see this form
              </p>
            </div>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="desktop" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">Desktop</span>
                </TabsTrigger>
                <TabsTrigger value="mobile" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Mobile</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        <div className={cn(
          "flex items-center justify-center bg-muted/30 overflow-auto flex-1",
          viewMode === "mobile" ? "p-8" : "p-6"
        )}>
          <div 
            className={cn(
              "transition-all duration-300 bg-background rounded-lg shadow-2xl border-8 overflow-hidden mx-auto",
              viewMode === "mobile" 
                ? "w-[375px] h-[667px] border-border" 
                : "w-full max-w-4xl h-[calc(90vh-200px)] border-transparent"
            )}
          >
            <ScrollArea className="h-full w-full rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground ml-4 text-lg font-medium">Loading preview...</p>
            </div>
          ) : (
            <div className={cn(
              "space-y-6",
              viewMode === "mobile" ? "px-4 py-4 pb-6" : "px-6 pb-6"
            )}>
              {/* Form Header */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className={cn(
                    "font-bold tracking-tight text-foreground",
                    viewMode === "mobile" ? "text-2xl" : "text-3xl"
                  )}>
                    {form?.title || "Form Title"}
                  </h2>
                  {form?.description && (
                    <p className={cn(
                      "text-muted-foreground",
                      viewMode === "mobile" ? "text-base" : "text-lg"
                    )}>
                      {form.description}
                    </p>
                  )}
                </div>
                <div className="h-px bg-border"></div>
              </div>

              {/* Mock Client Info Card */}
              <div className={cn(
                "rounded-2xl bg-card border border-border shadow-sm space-y-4",
                viewMode === "mobile" ? "p-4" : "p-6"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg",
                    viewMode === "mobile" ? "h-12 w-12" : "h-14 w-14"
                  )}>
                    <span className={cn(
                      "text-primary-foreground font-bold",
                      viewMode === "mobile" ? "text-lg" : "text-xl"
                    )}>JD</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className={cn(
                        "font-semibold text-foreground",
                        viewMode === "mobile" && "text-sm"
                      )}>
                        John Doe
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className={cn(
                        "text-muted-foreground",
                        viewMode === "mobile" ? "text-xs" : "text-sm"
                      )}>
                        john.doe@example.com
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-card-foreground">
                    {form?.package_name || "Package"}
                  </span>
                </div>
              </div>

              {/* Progress Recap Section */}
              {recap.length > 0 && (
                <div className={cn(
                  "rounded-2xl bg-card border border-border shadow-sm space-y-6",
                  viewMode === "mobile" ? "p-4" : "p-6"
                )}>
                  <div className="space-y-2">
                    <h3 className={cn(
                      "font-semibold text-foreground",
                      viewMode === "mobile" ? "text-lg" : "text-xl"
                    )}>Progress Recap</h3>
                    <p className={cn(
                      "text-muted-foreground",
                      viewMode === "mobile" ? "text-xs" : "text-sm"
                    )}>
                      Let's track your key metrics for this week.
                    </p>
                  </div>
                  <div className="h-px bg-border"></div>
                  <div className={cn(viewMode === "mobile" ? "space-y-4" : "space-y-6")}>
                    {recap.map((field) => renderField(field))}
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              {feedback.length > 0 && (
                <div className={cn(
                  "rounded-2xl bg-card border border-border shadow-sm space-y-6",
                  viewMode === "mobile" ? "p-4" : "p-6"
                )}>
                  <div className="space-y-2">
                    <h3 className={cn(
                      "font-semibold text-foreground",
                      viewMode === "mobile" ? "text-lg" : "text-xl"
                    )}>Your Feedback</h3>
                    <p className={cn(
                      "text-muted-foreground",
                      viewMode === "mobile" ? "text-xs" : "text-sm"
                    )}>
                      Share your thoughts, challenges, and goals for the upcoming week.
                    </p>
                  </div>
                  <div className="h-px bg-border"></div>
                  <div className={cn(viewMode === "mobile" ? "space-y-4" : "space-y-6")}>
                    {feedback.map((field) => renderField(field))}
                  </div>
                </div>
              )}

              {/* Other Fields */}
              {other.length > 0 && (
                <div className={cn(
                  "rounded-2xl bg-card border border-border shadow-sm space-y-6",
                  viewMode === "mobile" ? "p-4" : "p-6"
                )}>
                  <div className={cn(viewMode === "mobile" ? "space-y-4" : "space-y-6")}>
                    {other.map((field) => renderField(field))}
                  </div>
                </div>
              )}

              {/* Mock Submit Button */}
              <div className={cn(
                "rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20",
                viewMode === "mobile" ? "p-3" : "p-6"
              )}>
                <Button 
                  size={viewMode === "mobile" ? "default" : "lg"}
                  disabled
                  className={cn(
                    "w-full rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80 shadow-lg",
                    viewMode === "mobile" ? "py-5 text-base" : "py-6 text-lg"
                  )}
                >
                  <Send className={cn("mr-2", viewMode === "mobile" ? "h-4 w-4" : "h-5 w-5")} />
                  Submit Check-In
                </Button>
                <p className={cn(
                  "text-center text-muted-foreground mt-2",
                  viewMode === "mobile" ? "text-[10px]" : "text-xs"
                )}>
                  This is a preview - the submit button is disabled
                </p>
              </div>
            </div>
          )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

