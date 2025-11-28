"use client";

import { useState } from "react";
import { Employee, updateEmployeePermissions } from "@/lib/api/staff";
import { PermissionString } from "@/lib/types/permissions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PermissionsManagerProps {
  employee: Employee;
  onUpdate?: () => void;
}

interface PermissionConfig {
  key: keyof Employee;
  apiKey: PermissionString;
  label: string;
  description: string;
  category: "clients" | "payments" | "installments" | "integrations";
}

const PERMISSION_CONFIGS: PermissionConfig[] = [
  {
    key: "can_view_all_clients",
    apiKey: "view_all_clients",
    label: "View All Clients",
    description: "Can view all clients in the account (not just assigned)",
    category: "clients",
  },
  {
    key: "can_manage_all_clients",
    apiKey: "manage_all_clients",
    label: "Manage All Clients",
    description: "Can create, update, and delete all clients",
    category: "clients",
  },
  {
    key: "can_view_all_payments",
    apiKey: "view_all_payments",
    label: "View All Payments",
    description: "Can view all payments in the account",
    category: "payments",
  },
  {
    key: "can_manage_all_payments",
    apiKey: "manage_all_payments",
    label: "Manage All Payments",
    description: "Can create, update, and delete payments",
    category: "payments",
  },
  {
    key: "can_view_all_installments",
    apiKey: "view_all_installments",
    label: "View All Installments",
    description: "Can view all installments in the account",
    category: "installments",
  },
  {
    key: "can_manage_all_installments",
    apiKey: "manage_all_installments",
    label: "Manage All Installments",
    description: "Can create, update, and delete installments",
    category: "installments",
  },
  {
    key: "can_view_integrations",
    apiKey: "view_integrations",
    label: "View Integrations",
    description: "Can view integration settings and custom domain",
    category: "integrations",
  },
  {
    key: "can_manage_integrations",
    apiKey: "manage_integrations",
    label: "Manage Integrations",
    description: "Can edit and manage integration settings and custom domain",
    category: "integrations",
  },
];

export function PermissionsManager({ employee, onUpdate }: PermissionsManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    can_view_all_clients: employee.can_view_all_clients || false,
    can_manage_all_clients: employee.can_manage_all_clients || false,
    can_view_all_payments: employee.can_view_all_payments || false,
    can_manage_all_payments: employee.can_manage_all_payments || false,
    can_view_all_installments: employee.can_view_all_installments || false,
    can_manage_all_installments: employee.can_manage_all_installments || false,
    can_view_integrations: employee.can_view_integrations || false,
    can_manage_integrations: employee.can_manage_integrations || false,
  });

  const handlePermissionChange = (key: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Build array of enabled permissions
      const enabledPermissions: PermissionString[] = [];
      
      PERMISSION_CONFIGS.forEach(config => {
        if (permissions[config.key]) {
          enabledPermissions.push(config.apiKey);
        }
      });

      await updateEmployeePermissions(employee.id, enabledPermissions);

      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });

      onUpdate?.();
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = {
    clients: PERMISSION_CONFIGS.filter(p => p.category === "clients"),
    payments: PERMISSION_CONFIGS.filter(p => p.category === "payments"),
    installments: PERMISSION_CONFIGS.filter(p => p.category === "installments"),
  };

  // Super admins have all permissions by default
  if (employee.role === "super_admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Super admins have all permissions by default
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This user has full access to all features and cannot have their permissions modified.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Permissions</CardTitle>
        <CardDescription>
          Configure what {employee.name} can view and manage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Clients Permissions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Clients</h4>
          <div className="space-y-3">
            {groupedPermissions.clients.map(config => (
              <div key={config.key} className="flex items-start space-x-3">
                <Checkbox
                  id={config.key}
                  checked={permissions[config.key]}
                  onCheckedChange={(checked) => 
                    handlePermissionChange(config.key, checked as boolean)
                  }
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={config.key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {config.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments Permissions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Payments</h4>
          <div className="space-y-3">
            {groupedPermissions.payments.map(config => (
              <div key={config.key} className="flex items-start space-x-3">
                <Checkbox
                  id={config.key}
                  checked={permissions[config.key]}
                  onCheckedChange={(checked) => 
                    handlePermissionChange(config.key, checked as boolean)
                  }
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={config.key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {config.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Installments Permissions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Installments</h4>
          <div className="space-y-3">
            {groupedPermissions.installments.map(config => (
              <div key={config.key} className="flex items-start space-x-3">
                <Checkbox
                  id={config.key}
                  checked={permissions[config.key]}
                  onCheckedChange={(checked) => 
                    handlePermissionChange(config.key, checked as boolean)
                  }
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={config.key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {config.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Permissions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
