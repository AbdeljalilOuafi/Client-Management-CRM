import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { GOHIGHLEVEL_PERMISSIONS } from "@/lib/data/gohighlevel-permissions";

interface GoHighLevelPermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: Record<string, boolean>;
  onPermissionToggle: (permissionId: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const GoHighLevelPermissionsModal = ({
  open,
  onOpenChange,
  permissions,
  onPermissionToggle,
  onSave,
  onCancel,
}: GoHighLevelPermissionsModalProps) => {
  
  // Check if all permissions in a category are selected
  const isCategoryFullySelected = (categoryId: string) => {
    const category = GOHIGHLEVEL_PERMISSIONS.find(cat => cat.id === categoryId);
    if (!category) return false;
    return category.permissions.every(perm => permissions[perm.id]);
  };

  // Check if some (but not all) permissions in a category are selected
  const isCategoryPartiallySelected = (categoryId: string) => {
    const category = GOHIGHLEVEL_PERMISSIONS.find(cat => cat.id === categoryId);
    if (!category) return false;
    const selectedCount = category.permissions.filter(perm => permissions[perm.id]).length;
    return selectedCount > 0 && selectedCount < category.permissions.length;
  };

  // Toggle all permissions in a category
  const toggleCategoryAll = (categoryId: string) => {
    const category = GOHIGHLEVEL_PERMISSIONS.find(cat => cat.id === categoryId);
    if (!category) return;
    
    const shouldSelectAll = !isCategoryFullySelected(categoryId);
    category.permissions.forEach(permission => {
      if (permissions[permission.id] !== shouldSelectAll) {
        onPermissionToggle(permission.id);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            GoHighLevel Permissions
          </DialogTitle>
          <DialogDescription>
            Select the permissions for this staff member in GoHighLevel
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          <div className="space-y-6 py-4">
            {GOHIGHLEVEL_PERMISSIONS.map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Checkbox
                    id={`select-all-${category.id}`}
                    checked={isCategoryFullySelected(category.id)}
                    onCheckedChange={() => toggleCategoryAll(category.id)}
                    className={isCategoryPartiallySelected(category.id) ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                  <Label 
                    htmlFor={`select-all-${category.id}`}
                    className="font-semibold text-sm text-primary cursor-pointer"
                  >
                    {category.name}
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-4">
                  {category.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={permissions[permission.id] || false}
                        onCheckedChange={() => onPermissionToggle(permission.id)}
                      />
                      <Label htmlFor={permission.id} className="text-sm font-normal cursor-pointer leading-tight">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave}>
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
