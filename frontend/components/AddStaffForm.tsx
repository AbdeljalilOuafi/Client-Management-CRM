import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createEmployee } from "@/lib/api/staff";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { saveAppAccess } from "@/lib/utils/appAccessStorage";
import { getInitialPermissionsState } from "@/lib/data/gohighlevel-permissions";
import { GoHighLevelPermissionsModal } from "@/components/staff/GoHighLevelPermissionsModal";
import { sendGHLPermissions, buildGHLPayload } from "@/lib/api/gohighlevel";
import { CustomRolesMultiSelect } from "@/components/staff/CustomRolesMultiSelect";

interface AddStaffFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}


export const AddStaffForm = ({ onSuccess, onCancel }: AddStaffFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
    password: "",
    startDate: new Date().toISOString().split('T')[0],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [customRoleIds, setCustomRoleIds] = useState<string[]>([]);
  
  // App Access state
  const [appAccess, setAppAccess] = useState({
    onsync: false,
    gohighlevel: false,
  });
  const [ghlPermissions, setGhlPermissions] = useState<Record<string, boolean>>(getInitialPermissionsState());
  const [ghlConfigured, setGhlConfigured] = useState(false);
  const [showGhlModal, setShowGhlModal] = useState(false);
  const [tempGhlPermissions, setTempGhlPermissions] = useState<Record<string, boolean>>(getInitialPermissionsState());


  // Password validation helpers
  const passwordValidation = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Handle GoHighLevel checkbox change
  const handleGhlCheckboxChange = (checked: boolean) => {
    if (checked) {
      // Open modal to configure permissions
      setTempGhlPermissions({ ...ghlPermissions });
      setShowGhlModal(true);
    } else {
      // Uncheck and clear permissions
      setAppAccess({ ...appAccess, gohighlevel: false });
      setGhlPermissions(getInitialPermissionsState());
      setGhlConfigured(false);
    }
  };

  // Handle modal save
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
    setAppAccess({ ...appAccess, gohighlevel: true });
    setGhlConfigured(true);
    setShowGhlModal(false);
  };

  // Handle modal cancel
  const handleGhlModalCancel = () => {
    setShowGhlModal(false);
    setAppAccess({ ...appAccess, gohighlevel: false });
    setGhlPermissions(getInitialPermissionsState());
    setGhlConfigured(false);
    setTempGhlPermissions(getInitialPermissionsState());
  };

  // Toggle permission in temp state
  const toggleTempPermission = (permissionId: string) => {
    setTempGhlPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength only if OnSync access is enabled
    if (appAccess.onsync && !isPasswordValid) {
      toast({
        title: "Invalid Password",
        description: "Please meet all password requirements",
        variant: "destructive",
      });
      return;
    }

    // Validate GoHighLevel permissions if checkbox is checked
    if (appAccess.gohighlevel && !ghlConfigured) {
      toast({
        title: "Error",
        description: "Please configure GoHighLevel permissions",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Prepare employee data with app access
      const employeeData: any = {
        name: fullName,
        email: formData.email,
        role: formData.role, // System role (super_admin, admin, employee)
        phone_number: formData.phoneNumber || undefined,
        status: "active",
        is_active: true,
        start_date: formData.startDate,
        custom_roles: customRoleIds, // Array of custom role UUIDs
        app_access: {
          onsync: appAccess.onsync,
          gohighlevel: appAccess.gohighlevel,
        },
        ...(appAccess.gohighlevel && { gohighlevel_permissions: ghlPermissions }),
      };

      // Only include password if OnSync access is enabled
      if (appAccess.onsync) {
        employeeData.password = formData.password;
      }

      // Log the data for now (webhook will be added later)
      console.log("Employee data with app access:", employeeData);

      const newEmployee = await createEmployee(employeeData);
      console.log("[AddStaffForm] New employee created:", newEmployee);

      // Backend doesn't return ID, so we need to fetch the employee list to get the ID
      // Wait a moment for the backend to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save app access with email as temporary key (we'll update it after refresh)
      if (appAccess.onsync || appAccess.gohighlevel) {
        // Store with email temporarily
        const tempKey = `temp_${employeeData.email}`;
        localStorage.setItem(tempKey, JSON.stringify({
          email: employeeData.email,
          app_access: {
            onsync: appAccess.onsync,
            gohighlevel: appAccess.gohighlevel,
          },
          ...(appAccess.gohighlevel && { gohighlevel_permissions: ghlPermissions }),
        }));
        console.log("[AddStaffForm] Saved temp app access with email:", employeeData.email);

        // Send GHL permissions to webhook if GHL access is enabled
        if (appAccess.gohighlevel) {
          const ghlPayload = buildGHLPayload(employeeData.email, ghlPermissions);
          await sendGHLPermissions(ghlPayload);
          console.log("[AddStaffForm] GHL permissions sent to webhook");
        }
      }

      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">System Role *</Label>
          <Select
            required
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select system role" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            System role controls permissions. Use custom roles below for labeling.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
      </div>

      {/* Custom Roles Multi-Select */}
      <div className="space-y-2">
        <Label htmlFor="customRoles">Custom Roles (Tags)</Label>
        <CustomRolesMultiSelect
          value={customRoleIds}
          onChange={setCustomRoleIds}
        />
        <p className="text-xs text-muted-foreground">
          Optional: Add custom role tags for organization (e.g., Sales Manager, Team Lead)
        </p>
      </div>

      {/* App Access Section */}
      <div className="space-y-4 pt-4 border-t">
        <div>
          <h3 className="text-sm font-medium mb-3">App Access</h3>
          <div className="space-y-4">
            {/* OnSync Checkbox */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="onsync"
                  checked={appAccess.onsync}
                  onCheckedChange={(checked) => 
                    setAppAccess({ ...appAccess, onsync: checked as boolean })
                  }
                />
                <Label htmlFor="onsync" className="text-sm font-normal cursor-pointer">
                  Do they need access to OnSync app?
                </Label>
              </div>

              {/* Password Field - Shows under OnSync checkbox when checked */}
              {appAccess.onsync && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 space-y-3 pl-4 border-l-2 border-primary/20"
                >
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a strong password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground">Password must contain:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.minLength ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className={passwordValidation.minLength ? "text-green-600" : "text-muted-foreground"}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasUpperCase ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className={passwordValidation.hasUpperCase ? "text-green-600" : "text-muted-foreground"}>
                          One uppercase letter (A-Z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasLowerCase ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className={passwordValidation.hasLowerCase ? "text-green-600" : "text-muted-foreground"}>
                          One lowercase letter (a-z)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordValidation.hasNumber ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className={passwordValidation.hasNumber ? "text-green-600" : "text-muted-foreground"}>
                          One number (0-9)
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* GoHighLevel Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gohighlevel"
                checked={appAccess.gohighlevel}
                onCheckedChange={handleGhlCheckboxChange}
              />
              <Label htmlFor="gohighlevel" className="text-sm font-normal cursor-pointer">
                Do they need access to GoHighLevel app?
              </Label>
              {ghlConfigured && (
                <span className="flex items-center gap-1 text-xs text-green-600 ml-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Configured
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GoHighLevel Permissions Modal */}
      <GoHighLevelPermissionsModal
        open={showGhlModal}
        onOpenChange={setShowGhlModal}
        permissions={tempGhlPermissions}
        onPermissionToggle={toggleTempPermission}
        onSave={handleGhlModalSave}
        onCancel={handleGhlModalCancel}
      />

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Adding..." : "Add Staff Member"}
        </Button>
      </div>
    </motion.form>
  );
};
