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

interface AddStaffFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Custom roles storage key
const CUSTOM_ROLES_KEY = "custom_staff_roles";

// Get custom roles from localStorage
const getCustomRoles = (): string[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CUSTOM_ROLES_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save custom role to localStorage
const saveCustomRole = (role: string) => {
  const customRoles = getCustomRoles();
  if (!customRoles.includes(role)) {
    customRoles.push(role);
    localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(customRoles));
  }
};

export const AddStaffForm = ({ onSuccess, onCancel }: AddStaffFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "",
    customRole: "",
    password: "",
    startDate: new Date().toISOString().split('T')[0],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  
  // App Access state
  const [appAccess, setAppAccess] = useState({
    onsync: false,
    gohighlevel: false,
  });
  const [ghlPermissions, setGhlPermissions] = useState<Record<string, boolean>>(getInitialPermissionsState());
  const [ghlConfigured, setGhlConfigured] = useState(false);
  const [showGhlModal, setShowGhlModal] = useState(false);
  const [tempGhlPermissions, setTempGhlPermissions] = useState<Record<string, boolean>>(getInitialPermissionsState());

  // Load custom roles on mount
  useEffect(() => {
    setCustomRoles(getCustomRoles());
  }, []);

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

    // Validate custom role if "other" is selected
    if (formData.role === "other" && !formData.customRole.trim()) {
      toast({
        title: "Error",
        description: "Please enter a custom role",
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
      // Determine the final role
      let finalRole = formData.role;
      if (formData.role === "other") {
        finalRole = formData.customRole.trim();
        // Save custom role for future use
        saveCustomRole(finalRole);
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Prepare employee data with app access
      const employeeData: any = {
        name: fullName,
        email: formData.email,
        role: finalRole === "admin" ? "admin" : "employee", // Backend only accepts admin/employee
        job_role: finalRole, // Store actual role in job_role
        phone_number: formData.phoneNumber || undefined,
        status: "active",
        is_active: true,
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
            placeholder="+1 (555) 000-0000 (optional)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select
            required
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value, customRole: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="employee">Manager</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="closer">Closer</SelectItem>
              <SelectItem value="setter">Setter</SelectItem>
              {customRoles.map((customRole) => (
                <SelectItem key={customRole} value={customRole}>
                  {customRole}
                </SelectItem>
              ))}
              <SelectItem value="other">Other (Custom Role)</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Custom Role Input - Shows when "Other" is selected */}
      {formData.role === "other" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Label htmlFor="customRole">Custom Role Name *</Label>
          <Input
            id="customRole"
            required
            value={formData.customRole}
            onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
            placeholder="Enter custom role (e.g., Sales Manager, Trainer)"
          />
          <p className="text-xs text-muted-foreground">
            This role will be saved and available in the dropdown for future use
          </p>
        </motion.div>
      )}

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
