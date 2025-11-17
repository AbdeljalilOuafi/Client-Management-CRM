"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Pencil, Trash2, Loader2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Data structure for package types
export interface PackageType {
  id: string;
  name: string;
  description?: string;
  default_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Mock data for development
const mockPackages: PackageType[] = [
  {
    id: '1',
    name: 'Premium Coaching',
    description: '1-on-1 personalized coaching',
    default_price: 299,
    is_active: true,
    created_at: '2024-01-15'
  },
  {
    id: '2',
    name: 'Standard Plan',
    description: 'Group coaching sessions',
    default_price: 149,
    is_active: true,
    created_at: '2024-01-10'
  },
  {
    id: '3',
    name: 'Basic Package',
    default_price: 99,
    is_active: false,
    created_at: '2024-01-05'
  }
];

export const PackageManagement = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<PackageType | null>(null);
  const [activeTab, setActiveTab] = useState<string>("add");
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_price: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load packages on mount
  useEffect(() => {
    if (open) {
      fetchPackageTypes();
    }
  }, [open]);

  // TODO: Connect to backend
  const fetchPackageTypes = async () => {
    try {
      setLoading(true);
      // Will fetch from: GET /api/package-types
      console.log("Fetching package types...");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPackages(mockPackages);
    } catch (error) {
      console.error("Failed to fetch package types:", error);
      toast({
        title: "Error",
        description: "Failed to load package types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // TODO: Connect to backend
  const createPackageType = async (packageData: Partial<PackageType>) => {
    try {
      // Will post to: POST /api/package-types
      console.log("Creating package:", packageData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newPackage: PackageType = {
        id: Date.now().toString(),
        name: packageData.name!,
        description: packageData.description,
        default_price: packageData.default_price,
        is_active: packageData.is_active ?? true,
        created_at: new Date().toISOString(),
      };
      
      setPackages(prev => [newPackage, ...prev]);
      
      toast({
        title: "Success",
        description: "Package created successfully",
      });
      
      resetForm();
    } catch (error) {
      console.error("Failed to create package:", error);
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive",
      });
      throw error;
    }
  };

  // TODO: Connect to backend
  const updatePackageType = async (id: string, packageData: Partial<PackageType>) => {
    try {
      // Will put to: PUT /api/package-types/:id
      console.log("Updating package:", id, packageData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPackages(prev => prev.map(pkg => 
        pkg.id === id 
          ? { ...pkg, ...packageData, updated_at: new Date().toISOString() }
          : pkg
      ));
      
      toast({
        title: "Success",
        description: "Package updated successfully",
      });
      
      setEditingPackage(null);
      setEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to update package:", error);
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive",
      });
      throw error;
    }
  };

  // TODO: Connect to backend
  const deletePackageType = async (id: string) => {
    try {
      // Will delete: DELETE /api/package-types/:id
      console.log("Deleting package:", id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete package:", error);
      toast({
        title: "Error",
        description: "Failed to delete package",
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
        pkg.name.toLowerCase() === formData.name.toLowerCase() && 
        pkg.id !== editingPackage?.id
      );
      if (isDuplicate) {
        errors.name = "Package name already exists";
      }
    }
    
    if (formData.default_price && Number(formData.default_price) < 0) {
      errors.default_price = "Price must be a positive number";
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
      const packageData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        default_price: formData.default_price ? Number(formData.default_price) : undefined,
        is_active: formData.is_active,
      };
      
      if (editingPackage) {
        await updatePackageType(editingPackage.id, packageData);
      } else {
        await createPackageType(packageData);
      }
    } catch (error) {
      // Error already handled in create/update functions
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (pkg: PackageType) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      default_price: pkg.default_price?.toString() || '',
      is_active: pkg.is_active,
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleDelete = (pkg: PackageType) => {
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
      default_price: '',
      is_active: true,
    });
    setFormErrors({});
    setEditingPackage(null);
  };

  const handleCancel = () => {
    resetForm();
  };

  // Sort packages by created_at (newest first)
  const sortedPackages = [...packages].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Package className="h-4 w-4" />
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

                <div className="space-y-2">
                  <Label htmlFor="default_price">Default Price (Optional)</Label>
                  <Input
                    id="default_price"
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
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this package available for use
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
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
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
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
                          <h4 className="font-medium">{pkg.name}</h4>
                          <Badge variant={pkg.is_active ? "default" : "secondary"}>
                            {pkg.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {pkg.description && (
                          <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {pkg.default_price && (
                            <span>Default Price: ${pkg.default_price.toFixed(2)}</span>
                          )}
                          <span>Created: {new Date(pkg.created_at).toLocaleDateString()}</span>
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
              Update the details of {editingPackage?.name}
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

            <div className="space-y-2">
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
            </div>

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
              Are you sure you want to delete <strong>{packageToDelete?.name}</strong>? 
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
    </>
  );
};
