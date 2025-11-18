"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText, ExternalLink } from "lucide-react";
import FormBuilder from "@/components/FormBuilder";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { PermissionGuard } from "@/components/PermissionGuard";

interface Form {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  form_type?: string;
  package_type?: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const MOCK_PACKAGE_TYPES = [
  { id: "1", name: "Premium" },
  { id: "2", name: "Standard" },
  { id: "3", name: "Basic" },
];

// Mock data for demonstration
const INITIAL_MOCK_FORMS: Form[] = [
  {
    id: "1",
    title: "Weekly Check-in",
    description: "Standard weekly progress check-in for all clients",
    is_active: true,
    created_at: "2024-01-15",
    form_type: "checkins",
    package_type: "Premium",
  },
  {
    id: "2",
    title: "Onboarding Form",
    description: "Initial client onboarding questionnaire to gather baseline information and goals",
    is_active: true,
    created_at: "2024-01-10",
    form_type: "onboarding",
    package_type: "Standard",
  },
  {
    id: "3",
    title: "Monthly Review",
    description: "Comprehensive monthly progress review",
    is_active: true,
    created_at: "2024-01-05",
    form_type: "reviews",
    package_type: "Premium",
  },
];

function CheckinFormsContent() {
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>(INITIAL_MOCK_FORMS);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [formType, setFormType] = useState<string>("");
  const [packageTypeId, setPackageTypeId] = useState<string>("");
  const [checkinScheduleType, setCheckinScheduleType] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("UTC");

  const handleCreateForm = () => {
    if (!newFormTitle.trim()) {
      toast({
        title: "Error",
        description: "Form title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formType) {
      toast({
        title: "Error",
        description: "Form type is required",
        variant: "destructive",
      });
      return;
    }

    if (!packageTypeId) {
      toast({
        title: "Error",
        description: "Package type is required",
        variant: "destructive",
      });
      return;
    }

    // Validate checkin schedule if form type is checkins
    if (formType === "checkins") {
      if (!checkinScheduleType) {
        toast({
          title: "Error",
          description: "Checkin schedule is required",
          variant: "destructive",
        });
        return;
      }

      if (!time) {
        toast({
          title: "Error",
          description: "Time is required",
          variant: "destructive",
        });
        return;
      }

      if (checkinScheduleType === "same_time" && !dayOfWeek) {
        toast({
          title: "Error",
          description: "Day of week is required",
          variant: "destructive",
        });
        return;
      }
    }

    const newForm: Form = {
      id: Date.now().toString(),
      title: newFormTitle,
      description: newFormDescription || null,
      is_active: true,
      created_at: new Date().toISOString(),
      form_type: formType,
      package_type: MOCK_PACKAGE_TYPES.find(p => p.id === packageTypeId)?.name,
    };

    setForms([newForm, ...forms]);
    
    toast({
      title: "Success",
      description: "Form created successfully",
    });

    resetFormDialog();
    setSelectedFormId(newForm.id);
  };

  const resetFormDialog = () => {
    setShowCreateDialog(false);
    setNewFormTitle("");
    setNewFormDescription("");
    setFormType("");
    setPackageTypeId("");
    setCheckinScheduleType("");
    setDayOfWeek("");
    setTime("");
    setTimezone("UTC");
  };

  const handleDeleteForm = (id: string) => {
    setForms(forms.filter(f => f.id !== id));
    
    toast({
      title: "Success",
      description: "Form deleted successfully",
    });
  };

  const handlePreview = (id: string) => {
    toast({
      title: "Preview",
      description: "Opening form preview...",
    });
  };

  if (selectedFormId) {
    return (
      <FormBuilder
        formId={selectedFormId}
        onBack={() => setSelectedFormId(null)}
      />
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      

      {/* Main Content */}
      
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Check-in Forms</h1>
              <p className="text-muted-foreground mt-2">Create and manage client check-in forms</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>

          {/* Forms Grid */}
          {forms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form) => (
                <Card 
                  key={form.id} 
                  className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate pr-2">{form.title}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-accent"
                          onClick={() => setSelectedFormId(form.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteForm(form.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                      {form.description || "No description"}
                    </p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={() => handlePreview(form.id)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No forms yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first check-in form to get started
              </p>
              <Button onClick={() => setShowCreateDialog(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </Card>
          )}
        </div>
      

      {/* Create Form Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) resetFormDialog();
        else setShowCreateDialog(true);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input
                id="title"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                placeholder="e.g., Weekly Check-in"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                placeholder="Describe what this form is for..."
                className="mt-1.5 min-h-[80px]"
              />
            </div>
            <div>
              <Label htmlFor="form-type">Form Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger id="form-type" className="mt-1.5">
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="checkins">Check-ins</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="package-type">Package Type</Label>
              <Select value={packageTypeId} onValueChange={setPackageTypeId}>
                <SelectTrigger id="package-type" className="mt-1.5">
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PACKAGE_TYPES.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formType === "checkins" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Check-in Schedule</h3>
                <div>
                  <Label htmlFor="schedule-type">Schedule Type</Label>
                  <Select value={checkinScheduleType} onValueChange={setCheckinScheduleType}>
                    <SelectTrigger id="schedule-type" className="mt-1.5">
                      <SelectValue placeholder="Select schedule type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="same_time">
                        Send out to everybody at the same time each week
                      </SelectItem>
                      <SelectItem value="designated_day">
                        Each client has a designated checkin day
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {checkinScheduleType === "same_time" && (
                  <div>
                    <Label htmlFor="day-of-week">Day of Week</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                      <SelectTrigger id="day-of-week" className="mt-1.5">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {checkinScheduleType && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time">Time (24hr format)</Label>
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        placeholder="14:00"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger id="timezone" className="mt-1.5">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetFormDialog}>
                Cancel
              </Button>
              <Button onClick={handleCreateForm}>Create Form</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CheckinFormsPage() {
  return (
    <AuthGuard>
      <PermissionGuard requiredRole="super_admin" fallbackPath="/dashboard">
        <AppLayout>
          <CheckinFormsContent />
        </AppLayout>
      </PermissionGuard>
    </AuthGuard>
  );
}
