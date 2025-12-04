"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText, ExternalLink, Loader2, ArrowUpDown, Filter } from "lucide-react";
import FormBuilder from "@/components/FormBuilder";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { PermissionGuard } from "@/components/PermissionGuard";
import { CreateFormDialog, FormMetadata } from "@/components/CreateFormDialog";
import { FormPreviewDialog } from "@/components/FormPreviewDialog";
import { DeleteFormDialog } from "@/components/DeleteFormDialog";
import {
  listCheckInForms,
  deleteCheckInForm,
  updateCheckInForm,
  CheckInForm,
  CheckInFormField,
} from "@/lib/api/checkin-forms";


// Default fields for new check-in forms (same as mock data)
const DEFAULT_CHECKIN_FIELDS: CheckInFormField[] = [
  {
    id: "weight",
    type: "number",
    label: "Current Weight (kg)",
    required: true,
  } as CheckInFormField,
  {
    id: "energy_level",
    type: "select",
    label: "Energy Level",
    options: ["Low", "Medium", "High"],
    required: true,
  } as CheckInFormField,
  {
    id: "workouts_completed",
    type: "number",
    label: "Workouts Completed This Week",
    required: true,
  } as CheckInFormField,
  {
    id: "challenges",
    type: "textarea",
    label: "What challenges did you face?",
    required: false,
  } as CheckInFormField,
  {
    id: "goals",
    type: "textarea",
    label: "Goals for next week",
    required: true,
  } as CheckInFormField,
];

// Helper functions for localStorage form type management
const FORM_TYPES_KEY = 'form_types_mapping';

const getFormTypeFromStorage = (formId: string): "onboarding" | "checkins" | "reviews" | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const stored = localStorage.getItem(FORM_TYPES_KEY);
    if (stored) {
      const mapping = JSON.parse(stored);
      return mapping[formId];
    }
  } catch (e) {
    console.error('Error reading form types from localStorage:', e);
  }
  return undefined;
};

const saveFormTypeToStorage = (formId: string, formType: "onboarding" | "checkins" | "reviews") => {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(FORM_TYPES_KEY);
    const mapping = stored ? JSON.parse(stored) : {};
    mapping[formId] = formType;
    localStorage.setItem(FORM_TYPES_KEY, JSON.stringify(mapping));
  } catch (e) {
    console.error('Error saving form type to localStorage:', e);
  }
};

function CheckinFormsContent() {
  const { toast } = useToast();
  
  // State
  const [forms, setForms] = useState<CheckInForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [newFormMetadata, setNewFormMetadata] = useState<FormMetadata | null>(null);
  const [previewFormId, setPreviewFormId] = useState<string | null>(null);
  const [deleteFormData, setDeleteFormData] = useState<{ id: string; title: string; packageName: string } | null>(null);
  const [sortBy, setSortBy] = useState<"updated_date">("updated_date");
  const [filterPackage, setFilterPackage] = useState<string>("all");
  const [availablePackages, setAvailablePackages] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch data on mount
  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setIsLoading(true);
      const response = await listCheckInForms({
        ordering: "-created_at",
      });
      
      console.log("API Response - Full forms data:", response.results);
      console.log("Forms with schedules:", response.results.map(f => ({ 
        title: f.title, 
        has_schedule: !!f.schedule,
        schedule: f.schedule 
      })));
      
      // Merge form_type from localStorage if not present in API response
      const formsWithTypes = response.results.map(form => ({
        ...form,
        form_type: form.form_type || getFormTypeFromStorage(form.id) || undefined
      }));
      
      setForms(formsWithTypes);
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

  const handleDeleteFormClick = (form: CheckInForm) => {
    setDeleteFormData({
      id: form.id,
      title: form.title,
      packageName: form.package_name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteFormData) return;

    try {
      await deleteCheckInForm(deleteFormData.id);

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
      throw error; // Re-throw to let the dialog handle it
    }
  };

  const handlePreview = (id: string) => {
    setPreviewFormId(id);
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
    console.log("Form schedule data:", form.schedule);
    
    if (!form.schedule) {
      console.log("No schedule found for form:", form.id, form.title);
      return "No schedule";
    }
    
    const { schedule_type, schedule_day, schedule_time, timezone } = form.schedule;
    
    if (schedule_type === "SAME_DAY" && schedule_day) {
      return `Every ${schedule_day} at ${schedule_time} (${timezone})`;
    } else if (schedule_type === "INDIVIDUAL_DAYS") {
      return `Individual days at ${schedule_time} (${timezone})`;
    }
    
    return "No schedule";
  };

  // Extract unique packages from forms
  useEffect(() => {
    const uniquePackages = Array.from(
      new Map(
        forms.map(f => [f.package, { id: f.package, name: f.package_name }])
      ).values()
    );
    setAvailablePackages(uniquePackages);
  }, [forms]);

  // Filter and sort forms
  const getFilteredAndSortedForms = (formsList: CheckInForm[]) => {
    // Apply package filter
    let filtered = formsList;
    if (filterPackage !== "all") {
      filtered = formsList.filter(f => f.package.toString() === filterPackage);
    }
    
    // Apply sorting
    const sorted = [...filtered];
    if (sortBy === "updated_date") {
      return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    
    return sorted;
  };

  // Group forms by type (legacy forms without form_type default to checkins)
  const formsByType = {
    onboarding: getFilteredAndSortedForms(forms.filter(f => f.form_type === "onboarding")),
    checkins: getFilteredAndSortedForms(forms.filter(f => f.form_type === "checkins" || !f.form_type)),
    reviews: getFilteredAndSortedForms(forms.filter(f => f.form_type === "reviews")),
  };

  const formTypeLabels = {
    onboarding: "Onboarding",
    checkins: "Check-in",
    reviews: "Review",
  };

  const renderFormCard = (form: CheckInForm) => (
    <Card
      key={form.id}
      className="group hover:shadow-xl transition-all duration-300 hover:border-l-4 hover:border-l-primary border-l-4 border-l-transparent hover:-translate-y-1 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="truncate pr-2 group-hover:text-primary transition-colors">{form.title}</span>
          <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              onClick={() => setSelectedFormId(form.id)}
              title="Edit form"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              onClick={() => handleDeleteFormClick(form)}
              title="Delete form"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description - Only show if exists */}
        {form.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {form.description}
          </p>
        )}
        
        {/* Package Badge and Status Toggle */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
            {form.package_name}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-3 text-xs font-medium rounded-full transition-all duration-200 ${
              form.is_active
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(form);
            }}
            title={form.is_active ? "Click to deactivate" : "Click to activate"}
          >
            {form.is_active ? "● Active" : "○ Inactive"}
          </Button>
        </div>

        {/* Schedule Info */}
        <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">📅 Scheduled to:</span> {formatScheduleInfo(form)}
          </p>
        </div>

        {/* Dates Info */}
        <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/50">
          <div className="flex justify-between items-center">
            <span className="font-medium text-foreground/70">Created:</span>
            <span>{new Date(form.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-foreground/70">Updated:</span>
            <span className="font-semibold text-primary">{new Date(form.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Footer - Preview Button */}
        <div className="pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all duration-200 group"
            onClick={() => handlePreview(form.id)}
          >
            <ExternalLink className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
            Preview Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (selectedFormId || newFormMetadata) {
    return (
      <FormBuilder
        mode={selectedFormId ? "edit" : "create"}
        formId={selectedFormId || undefined}
        initialMetadata={newFormMetadata || undefined}
        onBack={() => {
          setSelectedFormId(null);
          setNewFormMetadata(null);
          fetchForms(); // Refresh forms when coming back
        }}
        onFormCreated={(formId) => {
          // Save form type to localStorage when a new form is created
          if (newFormMetadata?.form_type) {
            saveFormTypeToStorage(formId, newFormMetadata.form_type);
          }
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="px-6 py-8 shrink-0 border-b border-border/50">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Forms
            </h1>
            <p className="text-muted-foreground">Create and manage client forms</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Package Filter */}
            <Select value={filterPackage} onValueChange={setFilterPackage}>
              <SelectTrigger className="w-[200px] border-border/60 hover:border-primary/50 transition-colors">
                <Filter className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Filter by package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packages</SelectItem>
                {availablePackages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id.toString()}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[200px] border-border/60 hover:border-primary/50 transition-colors">
                <ArrowUpDown className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_date">Updated Date</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={() => setShowCreateDialog(true)} 
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area with Independent Column Scrolling */}
      <div className="flex-1 px-6 pb-6 min-h-0">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading forms...</span>
          </div>
        ) : forms.length > 0 ? (
          /* Forms by Category - Independent Scrolling Columns */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {(Object.keys(formsByType) as Array<keyof typeof formsByType>).map((type) => (
            <div key={type} className="flex flex-col min-h-0 h-full">
              {/* Category Header - Fixed */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm rounded-xl p-5 text-center mb-4 shrink-0 border border-primary/20 shadow-sm">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {formTypeLabels[type]}
                </h2>
              </div>

              {/* Forms in this category - Independently Scrollable */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-4 pr-2 pb-4">
                  {formsByType[type].length > 0 ? (
                    formsByType[type].map((form) => renderFormCard(form))
                  ) : (
                    <div className="bg-gradient-to-br from-muted/10 to-transparent rounded-xl p-8 text-center border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-colors">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground font-medium">
                        No {formTypeLabels[type].toLowerCase()} forms yet
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
        ) : (
          /* Empty State */
          <div className="flex items-center justify-center h-full">
            <Card className="p-12 text-center border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/20 via-background to-primary/5 shadow-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-50"></div>
                <FileText className="relative h-20 w-20 mx-auto text-primary mb-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                No forms yet
              </h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Create your first form to start collecting client information
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)} 
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Form
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* Create Form Dialog */}
      <CreateFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        hidePackageField={false}
        onFormMetadataReady={(metadata) => {
          setNewFormMetadata(metadata);
        }}
        onFormCreated={(newForm) => {
          // Save form type to localStorage for old workflow
          if (newForm?.id) {
            const formType = newForm.form_type as "onboarding" | "checkins" | "reviews" | undefined;
            if (formType) {
              saveFormTypeToStorage(newForm.id, formType);
            }
          }
          setForms(prev => [newForm, ...prev]);
        }}
      />

      {/* Preview Dialog */}
      {previewFormId && (
        <FormPreviewDialog
          open={!!previewFormId}
          onOpenChange={(open) => !open && setPreviewFormId(null)}
          formId={previewFormId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteFormData && (
        <DeleteFormDialog
          open={!!deleteFormData}
          onOpenChange={(open) => !open && setDeleteFormData(null)}
          formTitle={deleteFormData.title}
          packageName={deleteFormData.packageName}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
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
