"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Employee, updateEmployee, updateEmployeePermissions } from "@/lib/api/staff";
import { PermissionString, UserRole } from "@/lib/types/permissions";
import { PAGE_PERMISSIONS } from "@/lib/config/pagePermissions";
import { User, Mail, Phone, Briefcase, Shield, Settings, Save, X, Smartphone, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePermissions } from "@/contexts/PermissionsContext";
import { saveAppAccess, getAppAccess } from "@/lib/utils/appAccessStorage";
import { GoHighLevelPermissionsModal } from "@/components/staff/GoHighLevelPermissionsModal";
import { getInitialPermissionsState } from "@/lib/data/gohighlevel-permissions";

interface EmployeeDetailsDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  currentUserRole: string;
}

// Helper to map page IDs to permission fields
const getPagePermissionFields = (pageId: string): { view?: keyof Employee; edit?: keyof Employee } => {
  const mapping: Record<string, { view?: keyof Employee; edit?: keyof Employee }> = {
    "clients": { view: "can_view_all_clients", edit: "can_manage_all_clients" },
    "payments": { view: "can_view_all_payments", edit: "can_manage_all_payments" },
    "instalments": { view: "can_view_all_installments", edit: "can_manage_all_installments" },
  };
  return mapping[pageId] || {};
};

export function EmployeeDetailsDialog({
  employee,
  open,
  onOpenChange,
  onUpdate,
  currentUserRole,
}: EmployeeDetailsDialogProps) {
  const { toast } = useToast();
  const { refreshPermissions, user: currentUser } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [permissionChanges, setPermissionChanges] = useState<Record<string, boolean>>({});
  
  // App Access state
  const [appAccess, setAppAccess] = useState({
    onsync: false,
    gohighlevel: false,
  });
  const [ghlPermissions, setGhlPermissions] = useState<Record<string, boolean>>(getInitialPermissionsState());
  const [showGhlModal, setShowGhlModal] = useState(false);
  const [tempGhlPermissions, setTempGhlPermissions] = useState<Record<string, boolean>>(getInitialPermissionsState());
  const [hasAppAccessChanges, setHasAppAccessChanges] = useState(false);

  // Get manageable pages
  const manageablePages = PAGE_PERMISSIONS.filter(page => {
    const fields = getPagePermissionFields(page.id);
    return fields.view || fields.edit;
  });

  // Reset form when employee changes (but NOT during save operation)
  useEffect(() => {
    if (employee && !isSaving) {
      console.log("[EmployeeDetailsDialog] Employee prop changed (not saving):", {
        id: employee.id,
        name: employee.name,
        can_view_all_clients: employee.can_view_all_clients,
        can_manage_all_clients: employee.can_manage_all_clients,
      });
      
      setFormData({
        name: employee.name,
        email: employee.email,
        phone_number: employee.phone_number,
        job_role: employee.job_role,
        role: employee.role,
        status: employee.status,
        is_active: employee.is_active,
        start_date: employee.start_date,
        end_date: employee.end_date,
      });
      
      // Load app access from employee data or localStorage
      const storedAppAccess = getAppAccess(employee.id);
      if (employee.app_access || storedAppAccess) {
        const accessData = employee.app_access || storedAppAccess?.app_access;
        setAppAccess({
          onsync: accessData?.onsync || false,
          gohighlevel: accessData?.gohighlevel || false,
        });
        
        if (accessData?.gohighlevel && (employee.gohighlevel_permissions || storedAppAccess?.gohighlevel_permissions)) {
          const permissions = employee.gohighlevel_permissions || storedAppAccess?.gohighlevel_permissions;
          // Handle both array and object formats
          if (typeof permissions === 'object' && !Array.isArray(permissions)) {
            setGhlPermissions(permissions as Record<string, boolean>);
          } else {
            setGhlPermissions(getInitialPermissionsState());
          }
        } else {
          setGhlPermissions(getInitialPermissionsState());
        }
      } else {
        setAppAccess({ onsync: false, gohighlevel: false });
        setGhlPermissions(getInitialPermissionsState());
      }
      
      // Clear permission changes only when not saving
      setPermissionChanges({});
      setHasAppAccessChanges(false);
      setIsEditing(false);
    }
  }, [employee, isSaving]);

  if (!employee) return null;
  
  // Log the complete employee object for debugging
  console.log("[EmployeeDetailsDialog] Current employee object:", {
    id: employee.id,
    name: employee.name,
    role: employee.role,
    can_view_all_clients: employee.can_view_all_clients,
    can_manage_all_clients: employee.can_manage_all_clients,
    can_view_all_payments: employee.can_view_all_payments,
    can_manage_all_payments: employee.can_manage_all_payments,
    can_view_all_installments: employee.can_view_all_installments,
    can_manage_all_installments: employee.can_manage_all_installments,
    fullEmployee: employee,
  });

  const canEdit = currentUserRole === "super_admin" || 
                  (currentUserRole === "admin" && employee.role !== "super_admin");

  const handleSaveInfo = async () => {
    try {
      setIsSaving(true);
      console.log("[EmployeeDetailsDialog] Saving employee info:", {
        employeeId: employee.id,
        formData,
      });
      
      const result = await updateEmployee(employee.id, formData);
      console.log("[EmployeeDetailsDialog] Update result:", result);
      
      toast({
        title: "Success",
        description: "Employee information updated successfully",
      });
      
      onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: "Failed to update employee information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionToggle = (field: keyof Employee, checked: boolean) => {
    setPermissionChanges(prev => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setIsSaving(true);

      // Build permission fields object for PATCH request
      const permissionFields: Record<string, boolean> = {};
      
      const allPermissionFields = [
        'can_view_all_clients',
        'can_manage_all_clients',
        'can_view_all_payments',
        'can_manage_all_payments',
        'can_view_all_installments',
        'can_manage_all_installments',
      ];

      allPermissionFields.forEach((field) => {
        const isEnabled = permissionChanges[field] !== undefined 
          ? permissionChanges[field] 
          : employee[field as keyof Employee];
        
        console.log(`[PermissionDialog] Field: ${field}, isEnabled: ${isEnabled}`);
        permissionFields[field] = Boolean(isEnabled);
      });

      console.log("[PermissionDialog] Sending permission update:", {
        employeeId: employee.id,
        employeeName: employee.name,
        permissionFields,
        permissionChanges,
      });

      // Use PATCH to update employee directly (same as Postman)
      const result = await updateEmployee(employee.id, permissionFields);
      
      console.log("[PermissionDialog] Update result:", result);

      // Clear permission changes immediately after successful save
      setPermissionChanges({});

      // Check if we're updating the currently logged-in user
      const isUpdatingSelf = currentUser && currentUser.id === employee.id;
      
      if (isUpdatingSelf) {
        console.log("[PermissionDialog] Updated own permissions - refreshing session...");
        toast({
          title: "Success",
          description: "Your permissions have been updated and will take effect immediately.",
        });
        
        // Refresh the current user's permissions immediately
        await refreshPermissions();
      } else {
        toast({
          title: "Success", 
          description: "Permissions updated successfully. The user will see changes on their next login.",
        });
      }

      // Small delay to ensure backend has committed the changes
      await new Promise(resolve => setTimeout(resolve, 300));

      // Call onUpdate to refresh the employee list with updated permissions
      await onUpdate();
    } catch (error) {
      console.error("[PermissionDialog] Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionValue = (field: keyof Employee): boolean => {
    // If there's a pending change, use that; otherwise use the employee's current value
    const hasChange = permissionChanges[field] !== undefined;
    const changeValue = permissionChanges[field];
    const employeeValue = employee[field];
    const finalValue = hasChange ? changeValue : Boolean(employeeValue);
    
    console.log(`[getPermissionValue] Field: ${String(field)}`, {
      hasChange,
      changeValue,
      employeeValue,
      employeeValueType: typeof employeeValue,
      finalValue,
      isSaving,
    });
    
    return finalValue;
  };

  const hasPermissionChanges = Object.keys(permissionChanges).length > 0;

  // App Access handlers
  const handleAppAccessChange = (type: 'onsync' | 'gohighlevel', checked: boolean) => {
    if (type === 'gohighlevel' && checked) {
      // Open GHL permissions modal
      setTempGhlPermissions({ ...ghlPermissions });
      setShowGhlModal(true);
    } else if (type === 'gohighlevel' && !checked) {
      // Clear GHL permissions
      setAppAccess(prev => ({ ...prev, gohighlevel: false }));
      setGhlPermissions(getInitialPermissionsState());
      setHasAppAccessChanges(true);
    } else {
      setAppAccess(prev => ({ ...prev, [type]: checked }));
      setHasAppAccessChanges(true);
    }
  };

  const handleGhlModalSave = () => {
    // Check if at least one permission is selected
    const hasSelectedPermissions = Object.values(tempGhlPermissions).some(value => value === true);
    
    if (!hasSelectedPermissions) {
      toast({
        title: "No Permissions Selected",
        description: "Please select at least one permission or cancel to disable GoHighLevel access.",
        variant: "destructive",
      });
      return;
    }
    
    setGhlPermissions({ ...tempGhlPermissions });
    setAppAccess(prev => ({ ...prev, gohighlevel: true }));
    setShowGhlModal(false);
    setHasAppAccessChanges(true);
  };

  const handleGhlModalCancel = () => {
    setShowGhlModal(false);
    setAppAccess(prev => ({ ...prev, gohighlevel: false }));
  };

  const toggleTempPermission = (permissionId: string) => {
    setTempGhlPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSaveAppAccess = async () => {
    try {
      setIsSaving(true);
      
      // Save to localStorage (frontend storage)
      saveAppAccess({
        employeeId: employee.id,
        app_access: appAccess,
        gohighlevel_permissions: (appAccess.gohighlevel ? ghlPermissions : undefined) as any,
      });
      
      console.log("[EmployeeDetailsDialog] App access saved:", {
        employeeId: employee.id,
        appAccess,
        ghlPermissions: appAccess.gohighlevel ? ghlPermissions : undefined,
      });
      
      toast({
        title: "Success",
        description: "App access updated successfully",
      });
      
      setHasAppAccessChanges(false);
      await onUpdate();
    } catch (error) {
      console.error("Error saving app access:", error);
      toast({
        title: "Error",
        description: "Failed to update app access",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              {employee.name}
            </DialogTitle>
            <Badge variant={employee.is_active ? "default" : "secondary"}>
              {employee.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <User className="h-4 w-4 mr-2" />
              Information
            </TabsTrigger>
            <TabsTrigger value="app-access">
              <Smartphone className="h-4 w-4 mr-2" />
              App Access
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
          </TabsList>

          {/* Information Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Employee Details</CardTitle>
                {canEdit && (
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                        {employee.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    ) : (
                      <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                        {employee.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.phone_number || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      />
                    ) : (
                      <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                        {employee.phone_number || "-"}
                      </p>
                    )}
                  </div>

                  {/* Job Role */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      Job Title
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.job_role || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, job_role: e.target.value }))}
                      />
                    ) : (
                      <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                        {employee.job_role || "-"}
                      </p>
                    )}
                  </div>

                  {/* System Role */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      System Role
                    </Label>
                    {isEditing && currentUserRole === "super_admin" ? (
                      <Select
                        value={formData.role || employee.role}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="closer">Closer</SelectItem>
                          <SelectItem value="setter">Setter</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md capitalize">
                        {employee.role.replace("_", " ")}
                      </p>
                    )}
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Start Date
                    </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.start_date || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    ) : (
                      <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                        {employee.start_date 
                          ? new Date(employee.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : "-"}
                      </p>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      End Date
                    </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.end_date || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        disabled={formData.status === "active"}
                      />
                    ) : (
                      <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                        {employee.end_date 
                          ? new Date(employee.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : "-"}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Status
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.status || employee.status}
                        onValueChange={(value) => {
                          const updates: Partial<Employee> = { 
                            status: value,
                            is_active: value === "active"
                          };
                          
                          // Automatically set end_date when switching to inactive
                          if (value === "inactive" && !formData.end_date) {
                            updates.end_date = new Date().toISOString().split('T')[0];
                          }
                          // Clear end_date when switching back to active
                          if (value === "active") {
                            updates.end_date = null;
                          }
                          
                          setFormData(prev => ({ ...prev, ...updates }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          {/* <SelectItem value="on_leave">On Leave</SelectItem> */}
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md capitalize">
                        {employee.status?.replace("_", " ") || "-"}
                      </p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: employee.name,
                          email: employee.email,
                          phone_number: employee.phone_number,
                          job_role: employee.job_role,
                          role: employee.role,
                          status: employee.status,
                          is_active: employee.is_active,
                          start_date: employee.start_date,
                          end_date: employee.end_date,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveInfo} disabled={isSaving}>
                      {isSaving ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* App Access Tab */}
          <TabsContent value="app-access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Access</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage which applications this staff member can access
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {!canEdit ? (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      You don't have permission to modify this employee's app access.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {/* OnSync Access */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <div>
                            <Label className="text-base font-semibold">OnSync App</Label>
                            <p className="text-sm text-muted-foreground">
                              Access to the OnSync management platform
                            </p>
                          </div>
                        </div>
                        <Checkbox
                          checked={appAccess.onsync}
                          onCheckedChange={(checked) => handleAppAccessChange('onsync', checked as boolean)}
                        />
                      </div>

                      {/* GoHighLevel Access */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="h-5 w-5 text-primary" />
                          <div>
                            <Label className="text-base font-semibold">GoHighLevel App</Label>
                            <p className="text-sm text-muted-foreground">
                              Access to GoHighLevel CRM with custom permissions
                            </p>
                            {appAccess.gohighlevel && (
                              <Badge variant="outline" className="mt-1">
                                Permissions Configured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Checkbox
                          checked={appAccess.gohighlevel}
                          onCheckedChange={(checked) => handleAppAccessChange('gohighlevel', checked as boolean)}
                        />
                      </div>
                    </div>

                    <AnimatePresence>
                      {hasAppAccessChanges && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="flex justify-end gap-2 pt-4 border-t"
                        >
                          <Button
                            variant="outline"
                            onClick={() => {
                              // Reset to original values
                              const storedAppAccess = getAppAccess(employee.id);
                              if (employee.app_access || storedAppAccess) {
                                const accessData = employee.app_access || storedAppAccess?.app_access;
                                setAppAccess({
                                  onsync: accessData?.onsync || false,
                                  gohighlevel: accessData?.gohighlevel || false,
                                });
                              } else {
                                setAppAccess({ onsync: false, gohighlevel: false });
                              }
                              setHasAppAccessChanges(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSaveAppAccess} disabled={isSaving}>
                            {isSaving ? (
                              <>Saving...</>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save App Access
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Access Permissions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Control what this employee can view and manage
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {employee.role === "super_admin" ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-semibold mb-2">Super Admin Access</p>
                    <p className="text-sm text-muted-foreground">
                      Super admins have full access to all features and cannot have their permissions modified.
                    </p>
                  </div>
                ) : !canEdit ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      You don't have permission to modify this employee's permissions.
                    </p>
                  </div>
                ) : (
                  <>
                    {manageablePages.map((page) => {
                      const fields = getPagePermissionFields(page.id);
                      const hasViewField = !!fields.view;
                      const hasEditField = !!fields.edit;

                      if (!hasViewField && !hasEditField) return null;

                      return (
                        <div key={page.id} className="space-y-3">
                          <Separator />
                          <h4 className="font-semibold text-base">{page.name}</h4>
                          <div className="flex items-center gap-8 pl-4">
                            {hasViewField && (
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`view-${page.id}`}
                                  checked={getPermissionValue(fields.view!)}
                                  onCheckedChange={(checked) =>
                                    handlePermissionToggle(fields.view!, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={`view-${page.id}`}
                                  className="cursor-pointer font-medium"
                                >
                                  View All
                                </Label>
                              </div>
                            )}

                            {hasEditField && (
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={`edit-${page.id}`}
                                  checked={getPermissionValue(fields.edit!)}
                                  onCheckedChange={(checked) =>
                                    handlePermissionToggle(fields.edit!, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={`edit-${page.id}`}
                                  className="cursor-pointer font-medium"
                                >
                                  Manage All
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <AnimatePresence>
                      {hasPermissionChanges && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="flex justify-end gap-2 pt-4 border-t"
                        >
                          <Button
                            variant="outline"
                            onClick={() => setPermissionChanges({})}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSavePermissions} disabled={isSaving}>
                            {isSaving ? (
                              <>Saving...</>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Permissions
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* GoHighLevel Permissions Modal */}
      <GoHighLevelPermissionsModal
        open={showGhlModal}
        onOpenChange={setShowGhlModal}
        permissions={tempGhlPermissions}
        onPermissionToggle={toggleTempPermission}
        onSave={handleGhlModalSave}
        onCancel={handleGhlModalCancel}
      />
    </Dialog>
  );
}
