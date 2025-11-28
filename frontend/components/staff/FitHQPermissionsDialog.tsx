"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FitHQPermissions {
  restrictToAssignedData: boolean;
  clients: {
    view: boolean;
    edit: boolean;
    create: boolean;
    delete: boolean;
  };
  finances: {
    view: boolean;
    edit: boolean;
  };
  coaching: {
    view: boolean;
    edit: boolean;
  };
  forms: {
    view: boolean;
    edit: boolean;
    create: boolean;
    delete: boolean;
  };
  integrations: {
    view: boolean;
    edit: boolean;
  };
  dashboard: boolean;
  password: string;
}

interface FitHQPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (permissions: FitHQPermissions) => void;
  onCancel: () => void;
  initialPermissions?: FitHQPermissions | null;
}

const defaultPermissions: FitHQPermissions = {
  restrictToAssignedData: true, // Default checked
  clients: {
    view: false,
    edit: false,
    create: false,
    delete: false,
  },
  finances: {
    view: false,
    edit: false,
  },
  coaching: {
    view: false,
    edit: false,
  },
  forms: {
    view: false,
    edit: false,
    create: false,
    delete: false,
  },
  integrations: {
    view: false,
    edit: false,
  },
  dashboard: false,
  password: "",
};

export function FitHQPermissionsDialog({
  open,
  onOpenChange,
  onSave,
  onCancel,
  initialPermissions,
}: FitHQPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<FitHQPermissions>(
    initialPermissions || defaultPermissions
  );
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialPermissions) {
      setPermissions(initialPermissions);
    } else {
      setPermissions(defaultPermissions);
    }
  }, [initialPermissions, open]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter (A-Z)");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter (a-z)");
    if (!/[0-9]/.test(password)) errors.push("One number (0-9)");
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPermissions(prev => ({ ...prev, password: value }));
    setPasswordErrors(validatePassword(value));
  };

  const handleSave = () => {
    const errors = validatePassword(permissions.password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }
    onSave(permissions);
  };

  const handleCancel = () => {
    // Reset to initial permissions (not default) if they exist
    if (initialPermissions) {
      setPermissions(initialPermissions);
    } else {
      setPermissions(defaultPermissions);
    }
    setPasswordErrors([]);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">FitHQ App Permissions</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Configure what this employee can access in FitHQ
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Password Field */}
          <div className="space-y-3 pb-4 border-b">
            <Label htmlFor="password" className="text-base font-semibold">
              Password *
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={permissions.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={cn(
                  "pr-10",
                  passwordErrors.length > 0 && permissions.password && "border-destructive"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {permissions.password && (
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Password must contain:</p>
                <ul className="space-y-1">
                  {[
                    { text: "At least 8 characters", valid: permissions.password.length >= 8 },
                    { text: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(permissions.password) },
                    { text: "One lowercase letter (a-z)", valid: /[a-z]/.test(permissions.password) },
                    { text: "One number (0-9)", valid: /[0-9]/.test(permissions.password) },
                  ].map((rule, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      {rule.valid ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-destructive">✗</span>
                      )}
                      <span className={rule.valid ? "text-green-600" : "text-muted-foreground"}>
                        {rule.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Section 1: Data Access Restriction */}
          <div className="bg-accent/50 p-4 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <Checkbox
                id="restrictData"
                checked={permissions.restrictToAssignedData}
                onCheckedChange={(checked) =>
                  setPermissions(prev => ({ ...prev, restrictToAssignedData: checked as boolean }))
                }
              />
              <div className="space-y-1">
                <Label htmlFor="restrictData" className="text-base font-semibold cursor-pointer">
                  Restrict visible data to only assigned data
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, employee only sees clients/data assigned to them. When disabled, they see all data in the account.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Clients */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Clients</h3>
            <div className="space-y-2 ml-2">
              {[
                { key: "view", label: "View" },
                { key: "edit", label: "Edit" },
                { key: "create", label: "Create" },
                { key: "delete", label: "Delete" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`clients-${key}`}
                    checked={permissions.clients[key as keyof typeof permissions.clients]}
                    onCheckedChange={(checked) =>
                      setPermissions(prev => ({
                        ...prev,
                        clients: { ...prev.clients, [key]: checked as boolean },
                      }))
                    }
                  />
                  <Label htmlFor={`clients-${key}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Finances */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Finances</h3>
            <div className="space-y-2 ml-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="finances-view"
                  checked={permissions.finances.view}
                  onCheckedChange={(checked) =>
                    setPermissions(prev => ({
                      ...prev,
                      finances: { ...prev.finances, view: checked as boolean },
                    }))
                  }
                />
                <Label htmlFor="finances-view" className="cursor-pointer">
                  View finances <span className="text-xs text-muted-foreground">(can view all columns related to finances pages)</span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="finances-edit"
                  checked={permissions.finances.edit}
                  onCheckedChange={(checked) =>
                    setPermissions(prev => ({
                      ...prev,
                      finances: { ...prev.finances, edit: checked as boolean },
                    }))
                  }
                />
                <Label htmlFor="finances-edit" className="cursor-pointer">
                  Edit finances <span className="text-xs text-muted-foreground">(can edit all columns related to finances pages)</span>
                </Label>
              </div>
            </div>
          </div>

          {/* Section 4: Coaching */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Coaching</h3>
            <div className="space-y-2 ml-2">
              {[
                { key: "view", label: "View" },
                { key: "edit", label: "Edit" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`coaching-${key}`}
                    checked={permissions.coaching[key as keyof typeof permissions.coaching]}
                    onCheckedChange={(checked) =>
                      setPermissions(prev => ({
                        ...prev,
                        coaching: { ...prev.coaching, [key]: checked as boolean },
                      }))
                    }
                  />
                  <Label htmlFor={`coaching-${key}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Forms */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Forms</h3>
            <div className="space-y-2 ml-2">
              {[
                { key: "view", label: "View forms" },
                { key: "edit", label: "Edit forms" },
                { key: "create", label: "Create forms" },
                { key: "delete", label: "Delete forms" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`forms-${key}`}
                    checked={permissions.forms[key as keyof typeof permissions.forms]}
                    onCheckedChange={(checked) =>
                      setPermissions(prev => ({
                        ...prev,
                        forms: { ...prev.forms, [key]: checked as boolean },
                      }))
                    }
                  />
                  <Label htmlFor={`forms-${key}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Integrations */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Integrations</h3>
            <div className="space-y-2 ml-2">
              {[
                { key: "view", label: "View" },
                { key: "edit", label: "Edit" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`integrations-${key}`}
                    checked={permissions.integrations[key as keyof typeof permissions.integrations]}
                    onCheckedChange={(checked) =>
                      setPermissions(prev => ({
                        ...prev,
                        integrations: { ...prev.integrations, [key]: checked as boolean },
                      }))
                    }
                  />
                  <Label htmlFor={`integrations-${key}`} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-1">
                Only available for admin role. Grants access to manage app connections and custom domain.
              </p>
            </div>
          </div>

          {/* Section 7: Dashboard */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Dashboard</h3>
            <RadioGroup
              value={permissions.dashboard ? "yes" : "no"}
              onValueChange={(value: string) =>
                setPermissions(prev => ({ ...prev, dashboard: value === "yes" }))
              }
              className="ml-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="dashboard-yes" />
                <Label htmlFor="dashboard-yes" className="cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="dashboard-no" />
                <Label htmlFor="dashboard-no" className="cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={passwordErrors.length > 0 || !permissions.password}
          >
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
