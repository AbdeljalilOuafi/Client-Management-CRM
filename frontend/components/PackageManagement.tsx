"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Package as PackageIcon, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { 
  listCheckInForms, 
  CheckInForm
} from "@/lib/api/checkin-forms";
import { 
  listPackages, 
  createPackage, 
  updatePackage, 
  deletePackage, 
  Package as PackageAPI 
} from "@/lib/api/packages";
import { CreateFormDialog } from "@/components/CreateFormDialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Map API Package to local PackageType for compatibility
export interface PackageType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export const PackageManagement = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState<PackageAPI[]>([]);
  const [checkinForms, setCheckinForms] = useState<CheckInForm[]>([]);
  const [onboardingForms, setOnboardingForms] = useState<CheckInForm[]>([]);
  const [reviewForms, setReviewForms] = useState<CheckInForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [formsLoading, setFormsLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageAPI | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<PackageAPI | null>(null);
  const [activeTab, setActiveTab] = useState<string>("add");
  const [showCreateFormDialog, setShowCreateFormDialog] = useState(false);
  const [formTypeToCreate, setFormTypeToCreate] = useState<'checkin' | 'onboarding'>('onboarding');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    checkin_form: '' as string | null,
    onboarding_form: '' as string | null,
    review_form: '' as string | null,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load packages and forms on mount
  useEffect(() => {
    if (open) {
      fetchPackageTypes();
      fetchForms();
    }
  }, [open]);

  const fetchPackageTypes = async () => {
    try {
      setLoading(true);
      const data = await listPackages();
      setPackages(data);
    } catch (error: any) {
      console.error("Failed to fetch packages:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      setFormsLoading(true);
      
      // Fetch check-in forms from backend
      const checkinResponse = await listCheckInForms({ is_active: true });
      setCheckinForms(checkinResponse.results);
      
      // TODO: Fetch onboarding forms when API is available
      // For now, onboarding forms will show "No forms found"
      setOnboardingForms([]);
      
      // TODO: Fetch review forms when API is available
      // For now, review forms will show "No forms found"
      setReviewForms([]);
    } catch (error: any) {
      console.error("Failed to fetch forms:", error);
      // Don't show error toast for forms as it's not critical
    } finally {
      setFormsLoading(false);
    }
  };

  const createPackageType = async (packageData: { package_name: string; description?: string; checkin_form?: string | null; onboarding_form?: string | null; review_form?: string | null }) => {
    try {
      const newPackage = await createPackage(packageData);
      setPackages(prev => [newPackage, ...prev]);
      
      toast({
        title: "Success",
        description: "Package created successfully",
      });
      
      resetForm();
      setActiveTab("existing"); // Switch to existing tab to see the new package
    } catch (error: any) {
      console.error("Failed to create package:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePackageType = async (id: number, packageData: Partial<{ package_name: string; description?: string; is_active?: boolean; checkin_form?: string | null; onboarding_form?: string | null; review_form?: string | null }>) => {
    try {
      const updatedPackage = await updatePackage(id, packageData);
      
      setPackages(prev => prev.map(pkg => 
        pkg.id === id ? updatedPackage : pkg
      ));
      
      toast({
        title: "Success",
        description: "Package updated successfully",
      });
      
      setEditingPackage(null);
      setEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to update package:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePackageType = async (id: number) => {
    try {
      await deletePackage(id);
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
    } catch (error: any) {
      console.error("Failed to delete package:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      });
      throw error;
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Package name is required";
    } else {
      // Check for duplicate names (excluding current package when editing)
      const isDuplicate = packages.some(pkg => 
        pkg.package_name.toLowerCase() === formData.name.toLowerCase() && 
        pkg.id !== editingPackage?.id
      );
      if (isDuplicate) {
        errors.name = "Package name already exists";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingPackage) {
        // Update existing package
        const updateData: Partial<{ package_name: string; description?: string; is_active?: boolean; checkin_form?: string | null; onboarding_form?: string | null; review_form?: string | null }> = {
          package_name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          is_active: formData.is_active,
          checkin_form: formData.checkin_form || null,
          onboarding_form: formData.onboarding_form || null,
          review_form: formData.review_form || null,
        };
        await updatePackageType(editingPackage.id, updateData);
      } else {
        // Create new package
        const createData: { package_name: string; description?: string; checkin_form?: string | null; onboarding_form?: string | null; review_form?: string | null } = {
          package_name: formData.name.trim(),
        };
        
        // Only include description if it has a value
        if (formData.description.trim()) {
          createData.description = formData.description.trim();
        }
        
        // Include checkin_form, onboarding_form, and review_form (can be null)
        createData.checkin_form = formData.checkin_form || null;
        createData.onboarding_form = formData.onboarding_form || null;
        createData.review_form = formData.review_form || null;
        
        await createPackageType(createData);
      }
    } catch (error) {
      // Error already handled in create/update functions
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (pkg: PackageAPI) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.package_name,
      description: pkg.description || '',
      is_active: pkg.is_active ?? true,
      checkin_form: pkg.checkin_form || '',
      onboarding_form: pkg.onboarding_form || '',
      review_form: (pkg as any).review_form || '',
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleDelete = (pkg: PackageAPI) => {
    setPackageToDelete(pkg);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (packageToDelete) {
      await deletePackageType(packageToDelete.id);
      setDeleteConfirmOpen(false);
      setPackageToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      checkin_form: '',
      onboarding_form: '',
      review_form: '',
    });
    setFormErrors({});
    setEditingPackage(null);
  };

  const handleCancel = () => {
    resetForm();
  };

  // Sort packages by created_at (newest first)
  const sortedPackages = (Array.isArray(packages) ? [...packages] : []).sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <PackageIcon className="h-4 w-4" />
            Manage Package Types
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Package Types</DialogTitle>
            <DialogDescription>
              Create and manage custom package types for your payment system
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Add New Package</TabsTrigger>
              <TabsTrigger value="existing">Existing Packages</TabsTrigger>
            </TabsList>

            {/* Tab 1: Add/Edit Package Form */}
            <TabsContent value="add" className="space-y-4 mt-4">
              <div className="rounded-lg border p-4 space-y-4">
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Package Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Premium Coaching"
                    className={formErrors.name ? "border-red-500" : ""}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the package"
                    rows={3}
                  />
                </div>

                {/* Onboarding Form Dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="onboarding_form">Onboarding Form</Label>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <Select 
                    value={formData.onboarding_form || 'none'} 
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData(prev => ({ ...prev, onboarding_form: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, onboarding_form: value }));
                      }
                    }}
                  >
                    <SelectTrigger id="onboarding_form" className="bg-background">
                      <SelectValue placeholder="Select an onboarding form..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">None for now</SelectItem>
                      {onboardingForms.length === 0 && (
                        <SelectItem value="no_forms" disabled>
                          No forms found
                        </SelectItem>
                      )}
                      {onboardingForms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.onboarding_form && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Warning:</strong> No onboarding form will be sent to clients unless a form is assigned to this package.
                      </p>
                    </div>
                  )}
                </div>

                {/* Check-in Form Dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="checkin_form">Check-in Form</Label>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <Select 
                    value={formData.checkin_form || 'none'} 
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData(prev => ({ ...prev, checkin_form: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, checkin_form: value }));
                      }
                    }}
                  >
                    <SelectTrigger id="checkin_form" className="bg-background">
                      <SelectValue placeholder="Select a check-in form..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">None for now</SelectItem>
                      {formsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading forms...
                        </SelectItem>
                      ) : checkinForms.length === 0 ? (
                        <SelectItem value="no_forms" disabled>
                          No forms found
                        </SelectItem>
                      ) : (
                        checkinForms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            {form.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!formData.checkin_form && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Warning:</strong> No check-in form will be sent to clients unless a form is assigned to this package.
                      </p>
                    </div>
                  )}
                </div>

                {/* Review Form Dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="review_form">Review Form</Label>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <Select 
                    value={formData.review_form || 'none'} 
                    onValueChange={(value) => {
                      if (value === 'none') {
                        setFormData(prev => ({ ...prev, review_form: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, review_form: value }));
                      }
                    }}
                  >
                    <SelectTrigger id="review_form" className="bg-background">
                      <SelectValue placeholder="Select a review form..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="none">None for now</SelectItem>
                      <SelectItem value="no_forms" disabled>
                        No forms found
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {!formData.review_form && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Warning:</strong> No review form will be sent to clients unless a form is assigned to this package.
                      </p>
                    </div>
                  )}
                </div>

             

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Add Package'
                    )}
                  </Button>
                </div>
              </form>
              </div>
            </TabsContent>

            {/* Tab 2: Existing Packages List */}
            <TabsContent value="existing" className="space-y-4 mt-4">
              <div className="rounded-lg border p-4 space-y-4">
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedPackages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No custom packages yet.</p>
                  <p className="text-sm">Create your first package above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{pkg.package_name}</h4>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {pkg.description && (
                          <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        )}
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          {pkg.created_at && (
                            <span>Created: {new Date(pkg.created_at).toLocaleDateString()}</span>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {pkg.onboarding_form_title ? (
                              <Badge variant="outline" className="text-xs">
                                Onboarding: {pkg.onboarding_form_title}
                              </Badge>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 text-xs">
                                <AlertCircle className="h-3 w-3" />
                                No onboarding form
                              </span>
                            )}
                            {pkg.checkin_form_title ? (
                              <Badge variant="outline" className="text-xs">
                                Check-in: {pkg.checkin_form_title}
                              </Badge>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 text-xs">
                                <AlertCircle className="h-3 w-3" />
                                No check-in form
                              </span>
                            )}
                            {(pkg as any).review_form_title ? (
                              <Badge variant="outline" className="text-xs">
                                Review: {(pkg as any).review_form_title}
                              </Badge>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 text-xs">
                                <AlertCircle className="h-3 w-3" />
                                No review form
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(pkg)}
                          title="Edit package"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pkg)}
                          title="Delete package"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>
              Update the details of {editingPackage?.package_name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Package Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Premium Coaching"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the package"
                rows={3}
              />
            </div>

            {/* Onboarding Form Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-onboarding_form">Onboarding Form</Label>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <Select 
                value={formData.onboarding_form || 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormData(prev => ({ ...prev, onboarding_form: '' }));
                  } else {
                    setFormData(prev => ({ ...prev, onboarding_form: value }));
                  }
                }}
              >
                <SelectTrigger id="edit-onboarding_form" className="bg-background">
                  <SelectValue placeholder="Select an onboarding form..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="none">None for now</SelectItem>
                  {onboardingForms.length === 0 && (
                    <SelectItem value="no_forms" disabled>
                      No forms found
                    </SelectItem>
                  )}
                  {onboardingForms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.onboarding_form && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> No onboarding form will be sent to clients unless a form is assigned to this package.
                  </p>
                </div>
              )}
            </div>

            {/* Check-in Form Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-checkin_form">Check-in Form</Label>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <Select 
                value={formData.checkin_form || 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormData(prev => ({ ...prev, checkin_form: '' }));
                  } else {
                    setFormData(prev => ({ ...prev, checkin_form: value }));
                  }
                }}
              >
                <SelectTrigger id="edit-checkin_form" className="bg-background">
                  <SelectValue placeholder="Select a check-in form..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="none">None for now</SelectItem>
                  {formsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading forms...
                    </SelectItem>
                  ) : checkinForms.length === 0 ? (
                    <SelectItem value="no_forms" disabled>
                      No forms found
                    </SelectItem>
                  ) : (
                    checkinForms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!formData.checkin_form && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> No check-in form will be sent to clients unless a form is assigned to this package.
                  </p>
                </div>
              )}
            </div>

            {/* Review Form Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-review_form">Review Form</Label>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <Select 
                value={formData.review_form || 'none'} 
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormData(prev => ({ ...prev, review_form: '' }));
                  } else {
                    setFormData(prev => ({ ...prev, review_form: value }));
                  }
                }}
              >
                <SelectTrigger id="edit-review_form" className="bg-background">
                  <SelectValue placeholder="Select a review form..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="none">None for now</SelectItem>
                  <SelectItem value="no_forms" disabled>
                    No forms found
                  </SelectItem>
                </SelectContent>
              </Select>
              {!formData.review_form && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> No review form will be sent to clients unless a form is assigned to this package.
                  </p>
                </div>
              )}
            </div>

           

            {/* <div className="space-y-2">
              <Label htmlFor="edit-default_price">Default Price (Optional)</Label>
              <Input
                id="edit-default_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.default_price}
                onChange={(e) => setFormData(prev => ({ ...prev, default_price: e.target.value }))}
                placeholder="0.00"
                className={formErrors.default_price ? "border-red-500" : ""}
              />
              {formErrors.default_price && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.default_price}
                </p>
              )}
            </div> */}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="edit-is_active">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Make this package available for use
                </p>
              </div>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Package'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingPackage(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{packageToDelete?.package_name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Form Dialog */}
      <CreateFormDialog
        open={showCreateFormDialog}
        onOpenChange={setShowCreateFormDialog}
        defaultPackageId={editingPackage?.id}
        hidePackageField={true}
        onFormCreated={(newForm) => {
          // Add to appropriate forms list based on type
          if (formTypeToCreate === 'onboarding') {
            setOnboardingForms(prev => [newForm, ...prev]);
            // Auto-select the newly created form
            setFormData(prev => ({ ...prev, onboarding_form: newForm.id }));
          } else {
            setCheckinForms(prev => [newForm, ...prev]);
            // Auto-select the newly created form
            setFormData(prev => ({ ...prev, checkin_form: newForm.id }));
          }
        }}
      />
    </>
  );
};
