"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { X, Plus, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createCheckInForm, CreateCheckInFormData, listCheckInForms, CheckInForm, FormType } from "@/lib/api/checkin-forms";
import { listPackages, Package } from "@/lib/api/packages";

// Track which packages have which form types assigned
type PackageFormTypeMap = Record<FormType, Set<number>>;

// Schedule data for check-in forms
export interface CheckinScheduleData {
  schedule_type: "SAME_DAY" | "INDIVIDUAL_DAYS";
  day_of_week?: string;
  time: string;
  timezone: string;
  is_active: boolean;
}

// Schedule data for reviews forms (interval-based)
export interface ReviewsScheduleData {
  interval_type: "weekly" | "monthly";
  interval_count: number;
  time: string;
  timezone: string;
}

export interface FormMetadata {
  title: string;
  description?: string;
  form_type: "onboarding" | "checkins" | "reviews";
  packages?: number[];
  package_names?: string[];
  schedule_data?: CheckinScheduleData | ReviewsScheduleData;
}

interface CreateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFormCreated?: (form: any) => void;
  onFormMetadataReady?: (metadata: FormMetadata) => void; // New: for create mode
  defaultPackageId?: number; // Optional: pre-select a package
  hidePackageField?: boolean; // Optional: hide package field if it's auto-assigned
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const TIMEZONES = [
  "UTC",
  "Africa/Casablanca",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function CreateFormDialog({
  open,
  onOpenChange,
  onFormCreated,
  onFormMetadataReady,
  defaultPackageId,
  hidePackageField = false,
}: CreateFormDialogProps) {
  const { toast } = useToast();

  // State
  const [packages, setPackages] = useState<Package[]>([]);
  // Track which packages have which form types assigned (each package can have up to 3 forms - one of each type)
  const [packageFormTypeMap, setPackageFormTypeMap] = useState<PackageFormTypeMap>({
    checkins: new Set(),
    onboarding: new Set(),
    reviews: new Set(),
  });
  const [isCreating, setIsCreating] = useState(false);
  const [packagePopoverOpen, setPackagePopoverOpen] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<string>("");
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  
  // Check-in schedule fields
  const [scheduleType, setScheduleType] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("monday");
  
  // Reviews schedule fields
  const [intervalType, setIntervalType] = useState<string>("weekly");
  const [intervalCount, setIntervalCount] = useState<number>(1);
  
  // Shared schedule fields
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [timezone, setTimezone] = useState<string>("Africa/Casablanca");

  // Fetch packages on mount
  useEffect(() => {
    if (open && !hidePackageField) {
      fetchPackages();
    }
    // Don't auto-select defaultPackageId - user must manually select
  }, [open, hidePackageField]);

  const fetchPackages = async () => {
    try {
      // Fetch packages and forms in parallel
      const [packagesData, formsResponse] = await Promise.all([
        listPackages(),
        listCheckInForms()
      ]);
      
      setPackages(packagesData);
      
      // Build a map of form_type -> set of package IDs that have that form type
      const formTypeMap: PackageFormTypeMap = {
        checkins: new Set(),
        onboarding: new Set(),
        reviews: new Set(),
      };
      
      formsResponse.results.forEach((form: CheckInForm) => {
        if (form.package && form.form_type) {
          formTypeMap[form.form_type].add(form.package);
        }
      });
      
      setPackageFormTypeMap(formTypeMap);
      
      console.log("[CreateFormDialog] Package form type map:", {
        checkins: Array.from(formTypeMap.checkins),
        onboarding: Array.from(formTypeMap.onboarding),
        reviews: Array.from(formTypeMap.reviews),
      });
    } catch (error: any) {
      console.error("Failed to load packages:", error);
    }
  };

  // Filter packages - only show packages that don't have the SELECTED form_type assigned
  // Each package can have one form of each type (up to 3 total)
  const getAvailablePackages = () => {
    if (!formType) return [];
    
    // Get the set of package IDs that already have this form_type
    const assignedForThisType = packageFormTypeMap[formType as FormType] || new Set();
    
    // Filter out packages that already have this specific form_type assigned
    const available = packages.filter(pkg => !assignedForThisType.has(pkg.id));
    
    console.log(`[CreateFormDialog] Available packages for ${formType}:`, available.map(p => p.package_name));
    console.log(`[CreateFormDialog] Packages with ${formType} forms:`, Array.from(assignedForThisType));
    
    return available;
  };

  const availablePackages = getAvailablePackages();

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("");
    setSelectedPackages([]); // Default to no selection
    setScheduleType("");
    setDayOfWeek("monday");
    setIntervalType("weekly");
    setIntervalCount(1);
    setTime("09:00");
    setTimezone("Africa/Casablanca");
    setPackagePopoverOpen(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formTitle.trim()) {
      toast({
        title: "Error",
        description: "Form title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formType) {
      toast({
        title: "Error",
        description: "Form type is required",
        variant: "destructive",
      });
      return;
    }

    // Validate packages (now optional)
    const finalPackages = defaultPackageId 
      ? [defaultPackageId] 
      : selectedPackages.map(id => parseInt(id));

    // Validate schedule based on form type (onboarding forms don't need schedules)
    if (formType === "checkins" && !scheduleType) {
      toast({
        title: "Error",
        description: "Schedule type is required for check-in forms",
        variant: "destructive",
      });
      return;
    }

    if (formType === "reviews" && !intervalType) {
      toast({
        title: "Error",
        description: "Interval type is required for reviews forms",
        variant: "destructive",
      });
      return;
    }

    // Build schedule_data based on form_type
    const buildScheduleData = (): CheckinScheduleData | ReviewsScheduleData | undefined => {
      // Onboarding forms are one-time questionnaires - no schedule needed
      if (formType === "onboarding") {
        return undefined;
      }
      
      if (formType === "reviews") {
        return {
          interval_type: intervalType as "weekly" | "monthly",
          interval_count: intervalCount,
          time: time, // HH:MM format without seconds for reviews
          timezone: timezone,
        };
      }
      
      // Check-in forms
      return {
        schedule_type: scheduleType === "same_time" ? "SAME_DAY" : "INDIVIDUAL_DAYS",
        day_of_week: scheduleType === "same_time" ? dayOfWeek : undefined,
        time: `${time}:00`,
        timezone: timezone,
        is_active: true,
      };
    };

    // If onFormMetadataReady is provided, use new workflow (pass to FormBuilder)
    if (onFormMetadataReady) {
      const packageNames = finalPackages
        .map(id => packages.find(p => p.id === id)?.package_name)
        .filter(Boolean) as string[];

      const metadata: FormMetadata = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        form_type: formType as "onboarding" | "checkins" | "reviews",
        packages: finalPackages,
        package_names: packageNames,
        schedule_data: buildScheduleData(),
      };

      resetForm();
      onOpenChange(false);
      onFormMetadataReady(metadata);
      return;
    }

    // Old workflow: create immediately with default field (uses first package only)
    setIsCreating(true);

    try {
      const scheduleData = buildScheduleData();
      const formData: CreateCheckInFormData = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        form_type: formType as "onboarding" | "checkins" | "reviews",
        ...(finalPackages.length > 0 && { package: finalPackages[0] }), // Use first package for backend compatibility
        form_schema: {
          fields: [
            {
              id: "default_field",
              type: "text",
              label: "Default Field",
              required: false,
            },
          ],
        },
        is_active: true,
        ...(scheduleData && { schedule_data: scheduleData }),
      };

      const newForm = await createCheckInForm(formData);

      toast({
        title: "Success",
        description: "Form created successfully",
      });

      resetForm();
      onOpenChange(false);
      
      if (onFormCreated) {
        onFormCreated(newForm);
      }
    } catch (error: any) {
      console.error("Failed to create form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create form",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Create New Form
          </DialogTitle>
          <DialogDescription className="text-base">
            Create a new form to collect client information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Form Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-semibold text-foreground/90">Form Title *</Label>
            <Input
              id="title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Weekly Progress Check-In"
              className="mt-2 h-11 border-border/60 focus:border-primary/50 transition-colors"
              disabled={isCreating}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-semibold text-foreground/90">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe what this form is for..."
              className="mt-2 min-h-[90px] border-border/60 focus:border-primary/50 transition-colors resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Form Type */}
          <div>
            <Label htmlFor="form-type" className="text-sm font-semibold text-foreground/90">Form Type *</Label>
            <Select 
              value={formType} 
              onValueChange={setFormType}
              disabled={isCreating}
            >
              <SelectTrigger id="form-type" className="mt-2 h-11 border-border/60 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Select form type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding" className="cursor-pointer focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Onboarding</span>
                  </div>
                </SelectItem>
                <SelectItem value="checkins" className="cursor-pointer focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Check-ins</span>
                  </div>
                </SelectItem>
                <SelectItem value="reviews" className="cursor-pointer focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span>Reviews</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Package Types - Dropdown Multi-Select */}
          {!hidePackageField && formType && (
            <div>
              <Label className="text-sm font-semibold text-foreground/90">
                Packages (Optional)
              </Label>
              
              <Popover open={packagePopoverOpen} onOpenChange={setPackagePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={packagePopoverOpen}
                    className={`w-full justify-between mt-2 h-auto min-h-[44px] border-border/60 hover:border-primary/50 hover:bg-hover-primary transition-colors bg-background ${
                      packagePopoverOpen ? "ring-2 ring-primary/20 border-primary/50" : ""
                    }`}
                    disabled={isCreating || availablePackages.length === 0}
                  >
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {selectedPackages.length > 0 ? (
                        selectedPackages.map((pkgId) => {
                          const pkg = packages.find(p => p.id.toString() === pkgId);
                          return pkg ? (
                            <Badge 
                              key={pkgId}
                              variant="secondary" 
                              className="px-2 py-0.5 bg-primary/10 text-primary border-primary/20 hover:bg-hover-primary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPackages(prev => prev.filter(id => id !== pkgId));
                              }}
                            >
                              {pkg.package_name}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-muted-foreground">
                          {availablePackages.length === 0 
                            ? `No packages available for ${formType === "checkins" ? "check-in" : formType} forms` 
                            : "Select package(s)"}
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search packages..." className="h-9" />
                    <CommandEmpty>No packages found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {availablePackages.map((pkg) => {
                        const isSelected = selectedPackages.includes(pkg.id.toString());
                        return (
                          <CommandItem
                            key={pkg.id}
                            value={pkg.package_name}
                            onSelect={() => {
                              const pkgIdStr = pkg.id.toString();
                              if (isSelected) {
                                setSelectedPackages(prev => prev.filter(id => id !== pkgIdStr));
                              } else {
                                setSelectedPackages(prev => [...prev, pkgIdStr]);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div className={`h-4 w-4 border rounded flex items-center justify-center ${
                                isSelected ? 'bg-primary border-primary' : 'border-input'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <span>{pkg.package_name}</span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {availablePackages.length === 0 && formType && (
                <p className="text-xs text-muted-foreground mt-2">
                  ℹ️ All packages already have a {formType === "checkins" ? "check-in" : formType} form assigned.
                </p>
              )}
            </div>
          )}

          {/* Form Schedule Section - Only for checkins and reviews (not onboarding) */}
          {formType && formType !== "onboarding" && (
            <div className="space-y-5 border-t border-border/50 pt-5 mt-2">
              <div className="rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-border/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <h3 className="text-lg font-bold text-foreground">Form Schedule *</h3>
                </div>
            
                <div className="space-y-4">
                  {/* CHECK-IN SCHEDULE FIELDS */}
                  {formType === "checkins" && (
                    <>
                      {/* Schedule Type */}
                      <div>
                        <Label htmlFor="schedule-type" className="text-sm font-semibold text-foreground/90 mb-2 block">
                          Schedule Type
                        </Label>
                        <Select 
                          value={scheduleType} 
                          onValueChange={setScheduleType}
                          disabled={isCreating}
                        >
                          <SelectTrigger id="schedule-type" className="h-11 border-border/60 hover:border-primary/50 transition-colors bg-background">
                            <SelectValue placeholder="Select schedule type">
                              {scheduleType === "same_time" && "Same Day"}
                              {scheduleType === "designated_day" && "Individual Days"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same_time" className="cursor-pointer py-3 focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground">Same Day</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">All clients receive forms on the same day/time</div>
                              </div>
                            </SelectItem>
                            <SelectItem value="designated_day" className="cursor-pointer py-3 focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground">Individual Days</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">Each client has their own designated day</div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {scheduleType && (
                          <div className="mt-2 rounded-lg bg-muted/30 border border-border/50 p-3">
                            <p className="text-xs text-muted-foreground">
                              {scheduleType === "same_time" && "📅 Forms will be sent to all clients at the same day/time"}
                              {scheduleType === "designated_day" && "📅 Forms will be sent based on each client's designated day"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Day of Week (only for same_time) */}
                      {scheduleType === "same_time" && (
                        <div>
                          <Label htmlFor="day-of-week" className="text-sm font-semibold text-foreground/90">Day of Week</Label>
                          <Select 
                            value={dayOfWeek} 
                            onValueChange={setDayOfWeek}
                            disabled={isCreating}
                          >
                            <SelectTrigger id="day-of-week" className="mt-2 h-11 border-border/60 hover:border-primary/50 transition-colors bg-background">
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day.value} value={day.value} className="cursor-pointer focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Time and Timezone for Check-ins */}
                      {scheduleType && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <Label htmlFor="time" className="text-sm font-semibold text-foreground/90">
                              Time <span className="text-xs text-muted-foreground font-normal">(24hr)</span>
                            </Label>
                            <Input
                              id="time"
                              type="time"
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              placeholder="14:00"
                              className="mt-2 h-11 border-border/60 focus:border-primary/50 transition-colors bg-background"
                              disabled={isCreating}
                            />
                          </div>
                          <div>
                            <Label htmlFor="timezone" className="text-sm font-semibold text-foreground/90">Timezone</Label>
                            <Select 
                              value={timezone} 
                              onValueChange={setTimezone}
                              disabled={isCreating}
                            >
                              <SelectTrigger id="timezone" className="mt-2 h-11 border-border/60 hover:border-primary/50 transition-colors bg-background">
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {TIMEZONES.map((tz) => (
                                  <SelectItem key={tz} value={tz} className="cursor-pointer focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                                    {tz}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* REVIEWS SCHEDULE FIELDS */}
                  {formType === "reviews" && (
                    <>
                      {/* Interval Type */}
                      <div>
                        <Label htmlFor="interval-type" className="text-sm font-semibold text-foreground/90 mb-2 block">
                          Review Frequency
                        </Label>
                        <Select 
                          value={intervalType} 
                          onValueChange={setIntervalType}
                          disabled={isCreating}
                        >
                          <SelectTrigger id="interval-type" className="h-11 border-border/60 hover:border-primary/50 transition-colors bg-background">
                            <SelectValue placeholder="Select frequency">
                              {intervalType === "weekly" && "Weekly"}
                              {intervalType === "monthly" && "Monthly"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly" className="cursor-pointer py-3 focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground">Weekly</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">Send reviews every N weeks</div>
                              </div>
                            </SelectItem>
                            <SelectItem value="monthly" className="cursor-pointer py-3 focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                              <div className="space-y-1">
                                <div className="font-semibold text-foreground">Monthly</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">Send reviews every N months</div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Interval Count */}
                      <div>
                        <Label htmlFor="interval-count" className="text-sm font-semibold text-foreground/90">
                          Every {intervalType === "weekly" ? "N Weeks" : "N Months"}
                        </Label>
                        <Select 
                          value={intervalCount.toString()} 
                          onValueChange={(val) => setIntervalCount(parseInt(val))}
                          disabled={isCreating}
                        >
                          <SelectTrigger id="interval-count" className="mt-2 h-11 border-border/60 hover:border-primary/50 transition-colors bg-background">
                            <SelectValue placeholder="Select interval" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                              <SelectItem key={num} value={num.toString()} className="cursor-pointer focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                                Every {num} {intervalType === "weekly" ? (num === 1 ? "week" : "weeks") : (num === 1 ? "month" : "months")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="mt-2 rounded-lg bg-muted/30 border border-border/50 p-3">
                          <p className="text-xs text-muted-foreground">
                            📅 Reviews will be sent every {intervalCount} {intervalType === "weekly" ? (intervalCount === 1 ? "week" : "weeks") : (intervalCount === 1 ? "month" : "months")}
                          </p>
                        </div>
                      </div>

                      {/* Time and Timezone for Reviews */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <Label htmlFor="time-reviews" className="text-sm font-semibold text-foreground/90">
                            Send Time <span className="text-xs text-muted-foreground font-normal">(24hr)</span>
                          </Label>
                          <Input
                            id="time-reviews"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            placeholder="14:00"
                            className="mt-2 h-11 border-border/60 focus:border-primary/50 transition-colors bg-background"
                            disabled={isCreating}
                          />
                        </div>
                        <div>
                          <Label htmlFor="timezone-reviews" className="text-sm font-semibold text-foreground/90">Timezone</Label>
                          <Select 
                            value={timezone} 
                            onValueChange={setTimezone}
                            disabled={isCreating}
                          >
                            <SelectTrigger id="timezone-reviews" className="mt-2 h-11 border-border/60 hover:border-primary/50 transition-colors bg-background">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {TIMEZONES.map((tz) => (
                                <SelectItem key={tz} value={tz} className="cursor-pointer focus:bg-hover-primary data-[highlighted]:bg-hover-primary">
                                  {tz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Onboarding info - no schedule needed */}
          {formType === "onboarding" && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 mt-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ℹ️ Onboarding forms are one-time questionnaires and don't require a schedule. Clients will receive their onboarding link when assigned to a package.
              </p>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-border/50">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="px-6 hover:bg-muted transition-colors"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isCreating}
            className="px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Form
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
