"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  EmployeeRole,
  Employee,
  listEmployeeRoles,
  createEmployeeRole,
  updateEmployeeRole,
  deleteEmployeeRole,
  getEmployeesWithRole,
} from "@/lib/api/staff";
import { Pencil, Trash2, Plus, X, Users } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface ManageRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRolesUpdated?: () => void;
}

export function ManageRolesDialog({ open, onOpenChange, onRolesUpdated }: ManageRolesDialogProps) {
  const { toast } = useToast();
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<EmployeeRole | null>(null);
  const [deleteConfirmRole, setDeleteConfirmRole] = useState<EmployeeRole | null>(null);
  const [viewEmployeesRole, setViewEmployeesRole] = useState<EmployeeRole | null>(null);
  const [roleEmployees, setRoleEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6B7280",
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await listEmployeeRoles({ ordering: "name" });
      setRoles(response.results);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      toast({
        title: "Error",
        description: "Failed to load job titles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRole) {
        await updateEmployeeRole(editingRole.id, formData);
        toast({
          title: "Success",
          description: "Job title updated successfully",
        });
      } else {
        await createEmployeeRole(formData);
        toast({
          title: "Success",
          description: "Job title created successfully",
        });
      }
      
      resetForm();
      fetchRoles();
      onRolesUpdated?.();
    } catch (error: any) {
      const errorData = JSON.parse(error.message);
      const errorMessage = errorData.name?.[0] || errorData.color?.[0] || "Failed to save job title";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (role: EmployeeRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      color: role.color,
      is_active: role.is_active,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmRole) return;

    try {
      await deleteEmployeeRole(deleteConfirmRole.id);
      toast({
        title: "Success",
        description: "Job title deleted successfully",
      });
      fetchRoles();
      onRolesUpdated?.();
    } catch (error: any) {
      const errorData = JSON.parse(error.message);
      const errorMessage = errorData.error || errorData.detail || "Failed to delete job title";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmRole(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#6B7280",
      is_active: true,
    });
    setEditingRole(null);
  };

  const handleViewEmployees = async (role: EmployeeRole) => {
    if (role.employee_count === 0) return;
    
    try {
      setLoadingEmployees(true);
      setViewEmployeesRole(role);
      const employees = await getEmployeesWithRole(role.id);
      setRoleEmployees(employees);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
      setViewEmployeesRole(null);
    } finally {
      setLoadingEmployees(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              Manage Job Titles
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">Create and manage custom job title tags for your team members</p>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="space-y-6 p-6">
              {/* Add/Edit Role Form */}
              <form onSubmit={handleSubmit} className="space-y-4 border-2 rounded-xl p-6 bg-gradient-to-br from-card to-muted/30 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {editingRole ? (
                      <>
                        <Pencil className="h-5 w-5 text-primary" />
                        Edit Job Title
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 text-primary" />
                        Add New Job Title
                      </>
                    )}
                  </h3>
                  {editingRole && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Job Title Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Senior Coach, Nutritionist, Manager"
                      maxLength={100}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-sm font-semibold">Badge Color</Label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Input
                          id="color"
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value.toUpperCase() })}
                          className="w-20 h-11 p-1 cursor-pointer border-2"
                        />
                      </div>
                      <Input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value.toUpperCase() })}
                        placeholder="#6B7280"
                        pattern="^#([0-9A-Fa-f]{3}){1,2}$"
                        className="flex-1 h-11 font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: formData.color }} />
                      Preview: <Badge style={{ backgroundColor: formData.color, color: "white" }} className="text-xs">Sample</Badge>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this role's responsibilities..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer font-medium">
                      {formData.is_active ? "Active Job Title" : "Inactive Job Title"}
                    </Label>
                  </div>

                  <Button type="submit" size="lg" className="px-6 shadow-sm hover:shadow-md transition-all">
                    {editingRole ? (
                      <>
                        <Pencil className="h-4 w-4 mr-2" />
                        Update Job Title
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Job Title
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Existing Roles List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Existing Job Titles ({roles.length})
                    <Badge variant="secondary" className="ml-1">{roles.length}</Badge>
                  </h3>
                </div>
                
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
                    <p>Loading roles...</p>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-muted-foreground font-medium">No roles created yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add your first role using the form above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roles.map((role, index) => (
                      <div
                        key={role.id}
                        className="group flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-card to-muted/20"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-lg flex-shrink-0 shadow-sm ring-2 ring-background"
                              style={{ backgroundColor: role.color }}
                            />
                            {!role.is_active && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-muted-foreground rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-base">{role.name}</span>
                              {!role.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {role.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs gap-1.5 px-3 py-1.5 font-semibold",
                              role.employee_count > 0 && "cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                            )}
                            onClick={() => role.employee_count > 0 && handleViewEmployees(role)}
                          >
                            <Users className="h-3.5 w-3.5" />
                            {role.employee_count}
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(role)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmRole(role)}
                            disabled={role.employee_count > 0}
                            title={role.employee_count > 0 ? `Cannot delete: ${role.employee_count} employees assigned` : "Delete role"}
                            className="hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmRole} onOpenChange={() => setDeleteConfirmRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deleteConfirmRole?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Employees Dialog */}
      <Dialog open={!!viewEmployeesRole} onOpenChange={() => setViewEmployeesRole(null)}>
        <DialogContent className="max-w-3xl gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg shadow-sm ring-2 ring-background"
                style={{ backgroundColor: viewEmployeesRole?.color }}
              />
              <div>
                <div className="flex items-center gap-2">
                  Employees with <span className="text-primary">"{viewEmployeesRole?.name}"</span>
                </div>
                <p className="text-sm font-normal text-muted-foreground mt-1">
                  {roleEmployees.length} {roleEmployees.length === 1 ? 'employee' : 'employees'} assigned to this role
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-6">
              {loadingEmployees ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
                  <p>Loading employees...</p>
                </div>
              ) : roleEmployees.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-muted-foreground font-medium">No employees found</p>
                  <p className="text-sm text-muted-foreground mt-1">No one is currently assigned to this role</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roleEmployees.map((employee, index) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border-2 rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-card to-muted/20"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize font-semibold">
                          {employee.role.replace("_", " ")}
                        </Badge>
                        {employee.is_active ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            ✓ Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button variant="outline" onClick={() => setViewEmployeesRole(null)} className="px-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
