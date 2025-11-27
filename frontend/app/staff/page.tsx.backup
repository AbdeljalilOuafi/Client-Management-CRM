"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { listEmployees, getEmployeeStatistics, Employee, EmployeeStatistics } from "@/lib/api/staff";
import { Search, Plus, Settings2, ArrowUpDown, Users, Maximize2, Smartphone, Zap, Tags } from "lucide-react";
import { AddStaffForm } from "@/components/AddStaffForm";
import { AuthGuard } from "@/components/AuthGuard";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { EmployeeDetailsDialog } from "@/components/staff/EmployeeDetailsDialog";
import { ManageRolesDialog } from "@/components/staff/ManageRolesDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { mergeAppAccessWithEmployees } from "@/lib/utils/appAccessStorage";
import { Badge } from "@/components/ui/badge";

interface ColumnDefinition {
  id: string;
  label: string;
  visible: boolean;
}

// Helper function to determine if text should be dark or light based on background color
const getContrastColor = (hexColor: string): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const StaffContent = () => {
  const { toast } = useToast();
  const { user } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showManageRoles, setShowManageRoles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<EmployeeStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [columnDefinitions, setColumnDefinitions] = useState<ColumnDefinition[]>([
    { id: "id", label: "Employee ID", visible: true },
    { id: "name", label: "Full Name", visible: true },
    { id: "email", label: "Email", visible: true },
    { id: "phone_number", label: "Phone Number", visible: false },
    { id: "role", label: "System Role", visible: true },
    { id: "job_role", label: "Job Title", visible: true },
    { id: "start_date", label: "Start Date", visible: true },
    { id: "end_date", label: "End Date", visible: false },
    { id: "status", label: "Status", visible: true },
    { id: "is_active", label: "Active", visible: true },
    { id: "app_access", label: "App Access", visible: true },
  ]);


  useEffect(() => {
    fetchEmployees();
    fetchStatistics();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await listEmployees();
      
      console.log("[Staff Page] Raw employees from API:", response.results?.length);
      
      // Merge app access data from localStorage (temporary until backend supports it)
      const employeesWithAppAccess = mergeAppAccessWithEmployees(response.results || []);
      
      console.log("[Staff Page] After merging app access:", {
        total: employeesWithAppAccess.length,
        sample: employeesWithAppAccess[0],
        withAppAccess: employeesWithAppAccess.filter(e => e.app_access).length,
        employeeWithAccess: employeesWithAppAccess.find(e => e.id === 33),
        allEmployees: employeesWithAppAccess.map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          app_access: e.app_access,
        })),
      });
      
      setEmployees(employeesWithAppAccess);
      
      // If an employee is currently selected, update it with fresh data
      if (selectedEmployee) {
        const updatedEmployee = employeesWithAppAccess.find(emp => emp.id === selectedEmployee.id);
        if (updatedEmployee) {
          console.log("[Staff Page] Updating selected employee with fresh data:", {
            id: updatedEmployee.id,
            name: updatedEmployee.name,
            can_view_all_clients: updatedEmployee.can_view_all_clients,
            can_manage_all_clients: updatedEmployee.can_manage_all_clients,
            app_access: updatedEmployee.app_access,
            fullEmployee: updatedEmployee,
          });
          setSelectedEmployee(updatedEmployee);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const stats = await getEmployeeStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching employee statistics:", error);
      // Don't show error toast for statistics, it's not critical
    } finally {
      setStatsLoading(false);
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumnDefinitions(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleEmployeeClick = (employee: Employee) => {
    console.log("[Staff Page] Employee clicked:", {
      id: employee.id,
      name: employee.name,
      can_view_all_clients: employee.can_view_all_clients,
      can_manage_all_clients: employee.can_manage_all_clients,
      fullEmployee: employee,
    });
    setSelectedEmployee(employee);
    setShowEmployeeDialog(true);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };


  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && employee.is_active) ||
      (statusFilter === "inactive" && !employee.is_active);
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aVal = a[sortColumn as keyof Employee];
    let bVal = b[sortColumn as keyof Employee];
    if (aVal === null) aVal = "";
    if (bVal === null) bVal = "";
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return 0;
  });

  const visibleColumns = columnDefinitions.filter(col => col.visible);
  const uniqueRoles = Array.from(new Set(employees.map(e => e.role)));

  return (
    <div className="container mx-auto px-6 py-8">
      

      {/* Main Content */}
      
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h1 className="text-4xl font-bold">Staff Management</h1>
              <p className="text-muted-foreground mt-2">Manage your team members and permissions</p>
            </div>
            <div className="flex gap-3">
              {(user?.role === "super_admin" || user?.role === "admin") && (
                <Button 
                  onClick={() => setShowManageRoles(true)} 
                  variant="outline" 
                  size="lg"
                  className="gap-2 shadow-sm hover:shadow-lg transition-all hover:border-primary hover:bg-primary/5"
                >
                  <Tags className="h-4 w-4" />
                  Manage Roles
                </Button>
              )}
              <Button 
                onClick={() => setShowAddStaff(true)} 
                size="lg"
                className="gap-2 shadow-sm hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Staff Member
              </Button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow border-2">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search staff..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 shadow-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-background shadow-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="bg-background shadow-sm">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">All Roles</SelectItem>
                      {uniqueRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setShowColumnSettings(true)} className="shadow-sm hover:shadow-md transition-all">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </div>

                {/* Employee Statistics Summary */}
                <div className="flex gap-4 items-center text-sm border-t pt-4 mt-4">
                  {statsLoading ? (
                    <div className="flex gap-4">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ) : statistics ? (
                    <>
                      <span className="font-semibold text-foreground">
                        Total: <span className="text-primary">{statistics.total_employees || 0}</span>
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span className="font-medium">
                        Active: <span className="text-green-600">{statistics.active_employees || 0}</span>
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span className="font-medium">
                        Inactive: <span className="text-gray-600">{statistics.inactive_employees || 0}</span>
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No statistics available</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Staff Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded" />
                          <Skeleton className="h-10 flex-1" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-16"></TableHead>
                          {visibleColumns.map(col => (
                            <TableHead
                              key={col.id}
                              className="cursor-pointer hover:bg-muted/70 transition-colors"
                              onClick={() => handleSort(col.id)}
                            >
                              <div className="flex items-center gap-2">
                                {col.label}
                                <ArrowUpDown className="h-4 w-4" />
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedEmployees.length === 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={visibleColumns.length + 1} className="text-center py-16">
                              <div className="flex flex-col items-center gap-4">
                                <div className="rounded-full bg-muted p-6">
                                  <Users className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                  <h3 className="text-lg font-semibold">No staff members found</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {searchQuery || statusFilter !== "all" || roleFilter !== "all"
                                      ? "Try adjusting your search or filter criteria"
                                      : "Get started by adding your first staff member"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <AnimatePresence>
                            {sortedEmployees.map((employee, index) => (
                              <>
                                <motion.tr
                                  key={employee.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="border-b transition-colors hover:bg-muted/50"
                                >
                                  <TableCell className="text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEmployeeClick(employee)}
                                      className="h-8 w-8 p-0 hover:bg-primary/10"
                                    >
                                      <Maximize2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                  {visibleColumns.map(col => (
                                    <TableCell key={col.id}>
                                      {col.id === "id" && String(employee.id).slice(0, 8)}
                                      {col.id === "name" && <span className="font-medium">{employee.name}</span>}
                                      {col.id === "email" && (employee.email || "-")}
                                      {col.id === "phone_number" && (employee.phone_number || "-")}
                                      {col.id === "role" && (
                                        <div className="flex gap-1.5 flex-wrap">
                                          {employee.role === "super_admin" ? (
                                            <Badge 
                                              variant="destructive" 
                                              className="font-semibold px-3 py-1 text-xs shadow-sm hover:shadow-md transition-all"
                                            >
                                              Super Admin
                                            </Badge>
                                          ) : employee.role === "admin" ? (
                                            <Badge 
                                              className="bg-orange-500 hover:bg-orange-600 font-semibold px-3 py-1 text-xs shadow-sm hover:shadow-md transition-all"
                                            >
                                              Admin
                                            </Badge>
                                          ) : (
                                            <Badge 
                                              variant="secondary" 
                                              className="font-semibold px-3 py-1 text-xs shadow-sm hover:shadow-md transition-all"
                                            >
                                              Employee
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                      {col.id === "job_role" && (
                                        <div className="flex gap-1.5 flex-wrap">
                                          {employee.custom_role_names && employee.custom_role_names.length > 0 ? (
                                            employee.custom_role_names.map((name, index) => {
                                              const bgColor = employee.custom_role_colors?.[index] || "#6B7280";
                                              const textColor = getContrastColor(bgColor);
                                              return (
                                                <Badge
                                                  key={index}
                                                  style={{
                                                    backgroundColor: bgColor,
                                                    color: textColor,
                                                    borderColor: textColor === '#000000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                                                  }}
                                                  className="font-semibold px-3 py-1.5 text-xs shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border"
                                                >
                                                  {name}
                                                </Badge>
                                              );
                                            })
                                          ) : employee.job_role ? (
                                            <span className="text-sm font-medium text-foreground">{employee.job_role}</span>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                          )}
                                        </div>
                                      )}
                                      {col.id === "start_date" && (
                                        employee.start_date 
                                          ? new Date(employee.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                          : "-"
                                      )}
                                      {col.id === "end_date" && (
                                        employee.end_date 
                                          ? new Date(employee.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                          : "-"
                                      )}
                                      {col.id === "status" && (
                                        <span className="capitalize">{employee.status?.replace("_", " ") || "-"}</span>
                                      )}
                                      {col.id === "is_active" && (
                                        <span className={employee.is_active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                          {employee.is_active ? "Active" : "Inactive"}
                                        </span>
                                      )}
                                      {col.id === "app_access" && (
                                        <div className="flex items-center gap-2">
                                          {employee?.app_access?.fithq && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md" title="FitHQ Access">
                                              <Smartphone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">FitHQ</span>
                                            </div>
                                          )}
                                          {employee?.app_access?.gohighlevel && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md" title="GoHighLevel Access">
                                              <Zap className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">GHL</span>
                                            </div>
                                          )}
                                          {(!employee?.app_access?.fithq && !employee?.app_access?.gohighlevel) && (
                                            <span className="text-xs text-muted-foreground">-</span>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                  ))}
                                </motion.tr>
                              </>
                            ))}
                          </AnimatePresence>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Staff Member</DialogTitle>
          </DialogHeader>
          <AddStaffForm
            onSuccess={() => {
              setShowAddStaff(false);
              fetchEmployees();
            }}
            onCancel={() => setShowAddStaff(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Column Settings Dialog */}
      <Dialog open={showColumnSettings} onOpenChange={setShowColumnSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {columnDefinitions.map(col => (
              <div key={col.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`col-${col.id}`}
                  checked={col.visible}
                  onCheckedChange={() => toggleColumn(col.id)}
                />
                <Label htmlFor={`col-${col.id}`} className="cursor-pointer">
                  {col.label}
                </Label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Details Dialog */}
      <EmployeeDetailsDialog
        employee={selectedEmployee}
        open={showEmployeeDialog}
        onOpenChange={setShowEmployeeDialog}
        onUpdate={fetchEmployees}
        currentUserRole={user?.role || ""}
      />

      {/* Manage Roles Dialog */}
      <ManageRolesDialog
        open={showManageRoles}
        onOpenChange={setShowManageRoles}
        onRolesUpdated={fetchEmployees}
      />
    </div>
  );
};

const Staff = () => {
  return (
    <AuthGuard>
      <PermissionGuard requiredRole={["admin", "super_admin"]} fallbackPath="/dashboard">
        <AppLayout>
          <StaffContent />
        </AppLayout>
      </PermissionGuard>
    </AuthGuard>
  );
};

export default Staff;
