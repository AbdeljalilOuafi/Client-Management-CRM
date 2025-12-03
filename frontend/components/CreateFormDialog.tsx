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
import { X, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createCheckInForm, CreateCheckInFormData } from "@/lib/api/checkin-forms";
import { listPackages, Package } from "@/lib/api/packages";

export interface FormMetadata {
  title: string;
  description?: string;
  form_type: "onboarding" | "checkins" | "reviews";
  packages?: number[];
  package_names?: string[];
  schedule_data: {
    schedule_type: "SAME_DAY" | "INDIVIDUAL_DAYS";
    day_of_week?: string;
    time: string;
    timezone: string;
    is_active: boolean;
  };
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
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<string>("");
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("monday");
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
    if (defaultPackageId) {
      setSelectedPackages([defaultPackageId.toString()]);
    }
  }, [open, defaultPackageId, hidePackageField]);

  const fetchPackages = async () => {
    try {
      const packagesData = await listPackages();
      setPackages(packagesData);
    } catch (error: any) {
      console.error("Failed to load packages:", error);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("");
    setSelectedPackages(defaultPackageId ? [defaultPackageId.toString()] : []);
    setScheduleType("");
    setDayOfWeek("monday");
    setTime("09:00");
    setTimezone("Africa/Casablanca");
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

    // Validate packages
    const finalPackages = defaultPackageId 
      ? [defaultPackageId] 
      : selectedPackages.map(id => parseInt(id));
    
    // Only validate package if the field is visible
    if (!hidePackageField && finalPackages.length === 0) {
      toast({
        title: "Error",
        description: "At least one package is required",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleType) {
      toast({
        title: "Error",
        description: "Schedule type is required",
        variant: "destructive",
      });
      return;
    }

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
        schedule_data: {
          schedule_type: scheduleType === "same_time" ? "SAME_DAY" : "INDIVIDUAL_DAYS",
          day_of_week: scheduleType === "same_time" ? dayOfWeek : undefined,
          time: `${time}:00`,
          timezone: timezone,
          is_active: true,
        },
      };

      resetForm();
      onOpenChange(false);
      onFormMetadataReady(metadata);
      return;
    }

    // Old workflow: create immediately with default field (uses first package only)
    setIsCreating(true);

    try {
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
        schedule_data: {
          schedule_type: scheduleType === "same_time" ? "SAME_DAY" : "INDIVIDUAL_DAYS",
          day_of_week: scheduleType === "same_time" ? dayOfWeek : undefined,
          time: `${time}:00`,
          timezone: timezone,
          is_active: true,
        },
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
                <SelectItem value="onboarding" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>Onboarding</span>
                  </div>
                </SelectItem>
                <SelectItem value="checkins" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Check-ins</span>
                  </div>
                </SelectItem>
                <SelectItem value="reviews" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <span>Reviews</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Package Types - Multi-Select */}
          {!hidePackageField && (
            <div>
              <Label className="text-sm font-semibold text-foreground/90">Packages * (Select one or more)</Label>
              
              {/* Selected Packages Display */}
              {selectedPackages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 mb-2">
                  {selectedPackages.map((pkgId) => {
                    const pkg = packages.find(p => p.id.toString() === pkgId);
                    return pkg ? (
                      <Badge 
                        key={pkgId} 
                        variant="secondary" 
                        className="pl-3 pr-2 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        {pkg.package_name}
                        <button
                          type="button"
                          onClick={() => setSelectedPackages(prev => prev.filter(id => id !== pkgId))}
                          className="ml-2 hover:bg-destructive/30 rounded-full p-1 transition-colors"
                          disabled={isCreating}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {/* Package Checkboxes */}
              <div className="border border-border/60 rounded-xl p-4 mt-2 space-y-3 max-h-48 overflow-y-auto bg-muted/20">
                {packages.length > 0 ? (
                  packages.map((pkg) => (
                    <div 
                      key={pkg.id} 
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        const pkgIdStr = pkg.id.toString();
                        if (selectedPackages.includes(pkgIdStr)) {
                          setSelectedPackages(prev => prev.filter(id => id !== pkgIdStr));
                        } else {
                          setSelectedPackages(prev => [...prev, pkgIdStr]);
                        }
                      }}
                    >
                      <Checkbox
                        id={`package-${pkg.id}`}
                        checked={selectedPackages.includes(pkg.id.toString())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPackages(prev => [...prev, pkg.id.toString()]);
                          } else {
                            setSelectedPackages(prev => prev.filter(id => id !== pkg.id.toString()));
                          }
                        }}
                        disabled={isCreating}
                      />
                      <label
                        htmlFor={`package-${pkg.id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {pkg.package_name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <p className="text-sm text-muted-foreground">Loading packages...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Schedule Section */}
          {formType && (
            <div className="space-y-4 border-t border-border/50 pt-5 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1 w-1 rounded-full bg-primary animate-pulse"></div>
                <h3 className="font-bold text-foreground/90">Form Schedule *</h3>
              </div>
            
            {/* Schedule Type */}
            <div>
              <Label htmlFor="schedule-type" className="text-sm font-semibold text-foreground/90">Schedule Type</Label>
              <Select 
                value={scheduleType} 
                onValueChange={setScheduleType}
                disabled={isCreating}
              >
                <SelectTrigger id="schedule-type" className="mt-2 h-11 border-border/60 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select schedule type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_time" className="cursor-pointer">
                    <div className="py-1">
                      <div className="font-medium">Same Day</div>
                      <div className="text-xs text-muted-foreground">All clients get emails on the same day/time</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="designated_day" className="cursor-pointer">
                    <div className="py-1">
                      <div className="font-medium">Individual Days</div>
                      <div className="text-xs text-muted-foreground">Each client has their own designated day</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day of Week (only for same_time) */}
            {scheduleType === "same_time" && (
              <div>
                <Label htmlFor="day-of-week">Day of Week</Label>
                <Select 
                  value={dayOfWeek} 
                  onValueChange={setDayOfWeek}
                  disabled={isCreating}
                >
                  <SelectTrigger id="day-of-week" className="mt-1.5">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Time and Timezone */}
            {scheduleType && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time">Time (24hr format)</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="14:00"
                    className="mt-1.5"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={timezone} 
                    onValueChange={setTimezone}
                    disabled={isCreating}
                  >
                    <SelectTrigger id="timezone" className="mt-1.5">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
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
