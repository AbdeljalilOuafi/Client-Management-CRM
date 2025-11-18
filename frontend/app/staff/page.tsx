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
import { listEmployees, Employee } from "@/lib/api/staff";
import { Search, Plus, Settings2, ArrowUpDown, Users, Maximize2 } from "lucide-react";
import { AddStaffForm } from "@/components/AddStaffForm";
import { AuthGuard } from "@/components/AuthGuard";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { EmployeeDetailsDialog } from "@/components/staff/EmployeeDetailsDialog";
import { usePermissions } from "@/hooks/usePermissions";

interface ColumnDefinition {
  id: string;
  label: string;
  visible: boolean;
}

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
  const [loading, setLoading] = useState(true);
  const [columnDefinitions, setColumnDefinitions] = useState<ColumnDefinition[]>([
    { id: "id", label: "Employee ID", visible: true },
    { id: "name", label: "Full Name", visible: true },
    { id: "email", label: "Email", visible: true },
    { id: "phone_number", label: "Phone Number", visible: false },
    { id: "role", label: "System Role", visible: true },
    { id: "job_role", label: "Job Title", visible: true },
    { id: "status", label: "Status", visible: true },
    { id: "is_active", label: "Active", visible: true },
  ]);


  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await listEmployees();
      setEmployees(response.results || []);
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

  const toggleColumn = (columnId: string) => {
    setColumnDefinitions(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleEmployeeClick = (employee: Employee) => {
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
            <Button onClick={() => setShowAddStaff(true)} className="gap-2 shadow-sm hover:shadow-md transition-all">
              <Plus className="h-4 w-4" />
              Add Staff Member
            </Button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Filters & Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                                        <span className="capitalize">{employee.role.replace("_", " ")}</span>
                                      )}
                                      {col.id === "job_role" && (employee.job_role || "-")}
                                      {col.id === "status" && (
                                        <span className="capitalize">{employee.status?.replace("_", " ") || "-"}</span>
                                      )}
                                      {col.id === "is_active" && (
                                        <span className={employee.is_active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                          {employee.is_active ? "Active" : "Inactive"}
                                        </span>
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
