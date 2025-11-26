"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText, ExternalLink, Loader2 } from "lucide-react";
import FormBuilder from "@/components/FormBuilder";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { PermissionGuard } from "@/components/PermissionGuard";
import {
  listCheckInForms,
  createCheckInForm,
  deleteCheckInForm,
  updateCheckInForm,
  CheckInForm,
  CreateCheckInFormData,
} from "@/lib/api/checkin-forms";
import { listPackages, Package } from "@/lib/api/packages";

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
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

// Default fields for new check-in forms (same as mock data)
const DEFAULT_CHECKIN_FIELDS = [
  {
    id: "weight",
    type: "number",
    label: "Current Weight (kg)",
    required: true,
  },
  {
    id: "energy_level",
    type: "select",
    label: "Energy Level",
    options: ["Low", "Medium", "High"],
    required: true,
  },
  {
    id: "workouts_completed",
    type: "number",
    label: "Workouts Completed This Week",
    required: true,
  },
  {
    id: "challenges",
    type: "textarea",
    label: "What challenges did you face?",
    required: false,
  },
  {
    id: "goals",
    type: "textarea",
    label: "Goals for next week",
    required: true,
  },
];

function CheckinFormsContent() {
  const { toast } = useToast();
  
  // State
  const [forms, setForms] = useState<CheckInForm[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  
  // Form fields
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [formType, setFormType] = useState<string>("");
  const [packageTypeId, setPackageTypeId] = useState<string>("");
  const [checkinScheduleType, setCheckinScheduleType] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("Africa/Casablanca");

  // Fetch data on mount
  useEffect(() => {
    fetchForms();
    fetchPackages();
  }, []);

  const fetchForms = async () => {
    try {
      setIsLoading(true);
      const response = await listCheckInForms({
        ordering: "-created_at",
      });
      setForms(response.results);
    } catch (error: any) {
      console.error("Failed to load forms:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load forms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const packagesData = await listPackages();
      setPackages(packagesData);
    } catch (error: any) {
      console.error("Failed to load packages:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load packages",
        variant: "destructive",
      });
    }
  };

  const handleCreateForm = async () => {
    // Validation
    if (!newFormTitle.trim()) {
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

    if (!packageTypeId) {
      toast({
        title: "Error",
        description: "Package type is required",
        variant: "destructive",
      });
      return;
    }

    // Only Check-ins are implemented for now
    if (formType !== "checkins") {
      toast({
        title: "Coming Soon",
        description: `${formType === "onboarding" ? "Onboarding" : "Reviews"} forms will be available soon. Please select Check-ins for now.`,
        variant: "destructive",
      });
      return;
    }

    // Validate checkin schedule (required for check-in forms)
    if (formType === "checkins") {
      if (!checkinScheduleType) {
        toast({
          title: "Error",
          description: "Schedule type is required for check-in forms",
          variant: "destructive",
        });
        return;
      }

      if (!time) {
        toast({
          title: "Error",
          description: "Time is required",
          variant: "destructive",
        });
        return;
      }

      if (checkinScheduleType === "same_time" && !dayOfWeek) {
        toast({
          title: "Error",
          description: "Day of week is required for same time schedule",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsCreating(true);

      // Prepare form data according to API spec
      const formData: CreateCheckInFormData = {
        package: parseInt(packageTypeId),
        title: newFormTitle,
        description: newFormDescription || undefined,
        form_schema: {
          fields: DEFAULT_CHECKIN_FIELDS, // Use default fields
        },
        is_active: true,
        schedule_data: {
          schedule_type: checkinScheduleType === "same_time" ? "SAME_DAY" : "INDIVIDUAL_DAYS",
          day_of_week: checkinScheduleType === "same_time" ? dayOfWeek : undefined,
          time: `${time}:00`, // Convert HH:MM to HH:MM:SS
          timezone: timezone,
          is_active: true,
        },
      };

      const newForm = await createCheckInForm(formData);

      toast({
        title: "Success",
        description: "Form created successfully! Now add fields to your form.",
      });

      resetFormDialog();
      setSelectedFormId(newForm.id);
      fetchForms(); // Refresh the list
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

  const resetFormDialog = () => {
    setShowCreateDialog(false);
    setNewFormTitle("");
    setNewFormDescription("");
    setFormType("");
    setPackageTypeId("");
    setCheckinScheduleType("");
    setDayOfWeek("");
    setTime("");
    setTimezone("Africa/Casablanca");
  };

  const handleDeleteForm = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCheckInForm(id);

      toast({
        title: "Success",
        description: "Form deleted successfully",
      });

      fetchForms(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to delete form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete form",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (id: string) => {
    // TODO: Implement preview functionality
    toast({
      title: "Preview",
      description: "Opening form preview...",
    });
  };

  const handleToggleStatus = async (form: CheckInForm) => {
    const newStatus = !form.is_active;
    const statusText = newStatus ? "activate" : "deactivate";

    try {
      await updateCheckInForm(form.id, {
        is_active: newStatus,
      });

      toast({
        title: "Success",
        description: `Form ${statusText}d successfully. ${!newStatus ? "Schedule has been stopped." : "Schedule is now active."}`
      });

      fetchForms(); // Refresh the list
    } catch (error: any) {
      console.error(`Failed to ${statusText} form:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${statusText} form`,
        variant: "destructive",
      });
    }
  };

  const formatScheduleInfo = (form: CheckInForm): string => {
    if (!form.schedule) return "No schedule";
    
    const { schedule_type, schedule_day, schedule_time } = form.schedule;
    
    if (schedule_type === "SAME_DAY" && schedule_day) {
      return `Every ${schedule_day} at ${schedule_time}`;
    } else if (schedule_type === "INDIVIDUAL_DAYS") {
      return `Individual days at ${schedule_time}`;
    }
    
    return "No schedule";
  };

  if (selectedFormId) {
    return (
      <FormBuilder
        formId={selectedFormId}
        onBack={() => {
          setSelectedFormId(null);
          fetchForms(); // Refresh forms when coming back
        }}
      />
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Forms</h1>
            <p className="text-muted-foreground mt-2">Create and manage client forms</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading forms...</span>
          </div>
        ) : forms.length > 0 ? (
          /* Forms Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card
                key={form.id}
                className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate pr-2">{form.title}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-accent"
                        onClick={() => setSelectedFormId(form.id)}
                        title="Edit form"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteForm(form.id, form.title)}
                        title="Delete form"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {form.description || "No description"}
                  </p>
                  
                  {/* Package Badge and Status Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {form.package_name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 px-2 text-xs font-medium rounded-full ${
                        form.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(form);
                      }}
                      title={form.is_active ? "Click to deactivate" : "Click to activate"}
                    >
                      {form.is_active ? "Active" : "Inactive"}
                    </Button>
                  </div>

                  {/* Schedule Info */}
                  <p className="text-xs text-muted-foreground">
                    📅 {formatScheduleInfo(form)}
                  </p>

                  {/* Footer */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                    <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => handlePreview(form.id)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first form to get started
            </p>
            <Button onClick={() => setShowCreateDialog(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </Card>
        )}
      </div>

      {/* Create Form Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) resetFormDialog();
          else setShowCreateDialog(true);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Form Title */}
            <div>
              <Label htmlFor="title">Form Title *</Label>
              <Input
                id="title"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                placeholder="e.g., Weekly Progress Check-In"
                className="mt-1.5"
                disabled={isCreating}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                placeholder="Describe what this form is for..."
                className="mt-1.5 min-h-[80px]"
                disabled={isCreating}
              />
            </div>

            {/* Form Type */}
            <div>
              <Label htmlFor="form-type">Form Type *</Label>
              <Select 
                value={formType} 
                onValueChange={setFormType}
                disabled={isCreating}
              >
                <SelectTrigger id="form-type" className="mt-1.5">
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="checkins">Check-ins</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Package Type */}
            <div>
              <Label htmlFor="package-type">Package Type *</Label>
              <Select 
                value={packageTypeId} 
                onValueChange={setPackageTypeId}
                disabled={isCreating}
              >
                <SelectTrigger id="package-type" className="mt-1.5">
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
                <SelectContent>
                  {packages.length > 0 ? (
                    packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id.toString()}>
                        {pkg.package_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading packages...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Check-in Schedule Section - Only for Check-ins */}
            {formType === "checkins" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Check-in Schedule *</h3>
              
              {/* Schedule Type */}
              <div>
                <Label htmlFor="schedule-type">Schedule Type</Label>
                <Select 
                  value={checkinScheduleType} 
                  onValueChange={setCheckinScheduleType}
                  disabled={isCreating}
                >
                  <SelectTrigger id="schedule-type" className="mt-1.5">
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_time">
                      Same Day - All clients get emails on the same day/time
                    </SelectItem>
                    <SelectItem value="designated_day">
                      Individual Days - Each client has their own check-in day
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Day of Week (only for same_time) */}
              {checkinScheduleType === "same_time" && (
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
                        <SelectItem key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Time and Timezone */}
              {checkinScheduleType && (
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={resetFormDialog}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateForm}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Form"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CheckinFormsPage() {
  return (
    <AuthGuard>
      <PermissionGuard requiredRole="super_admin" fallbackPath="/dashboard">
        <AppLayout>
          <CheckinFormsContent />
        </AppLayout>
      </PermissionGuard>
    </AuthGuard>
  );
}
