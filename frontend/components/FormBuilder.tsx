"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, GripVertical, Trash2, Settings, X, ChevronLeft, Loader2 } from "lucide-react";
import QuestionEditor from "@/components/QuestionEditor";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { FormMetadata } from "@/components/CreateFormDialog";
import { createCheckInForm, getCheckInForm, updateCheckInForm, CheckInFormField } from "@/lib/api/checkin-forms";

interface Question {
  id: string;
  question_text: string;
  question_type: "file_upload" | "short_text" | "long_text" | "multiple_choice" | "number";
  is_required: boolean;
  order_index: number;
  config: any;
}

interface FormBuilderProps {
  mode: "create" | "edit";
  formId?: string;
  initialMetadata?: FormMetadata;
  onBack: () => void;
  onFormCreated?: (formId: string) => void;
}

// Mock questions for demonstration
const INITIAL_MOCK_QUESTIONS: Question[] = [
  {
    id: "1",
    question_text: "How are you feeling this week?",
    question_type: "short_text",
    is_required: true,
    order_index: 0,
    config: {},
  },
  {
    id: "2",
    question_text: "What were your biggest wins this week?",
    question_type: "long_text",
    is_required: true,
    order_index: 1,
    config: {},
  },
  {
    id: "3",
    question_text: "How would you rate your energy levels?",
    question_type: "multiple_choice",
    is_required: false,
    order_index: 2,
    config: {
      options: ["Low", "Medium", "High", "Very High"],
      allow_multiple: false,
      allow_other: false,
    },
  },
  {
    id: "4",
    question_text: "Current weight (kg)",
    question_type: "number",
    is_required: false,
    order_index: 3,
    config: {},
  },
  {
    id: "5",
    question_text: "Upload progress photos",
    question_type: "file_upload",
    is_required: false,
    order_index: 4,
    config: {},
  },
];

const QUESTION_TYPE_LABELS: Record<Question["question_type"], string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Multiple Choice",
  number: "Number",
  file_upload: "File Upload",
};

export default function FormBuilder({ mode, formId, initialMetadata, onBack, onFormCreated }: FormBuilderProps) {
  const { toast } = useToast();
  const [formTitle, setFormTitle] = useState(initialMetadata?.title || "Weekly Check-in");
  const [formDescription, setFormDescription] = useState(initialMetadata?.description || "Standard weekly progress check-in");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize sidebar state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('formBuilderSidebarOpen');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Fetch form data in edit mode
  useEffect(() => {
    if (mode === "edit" && formId) {
      fetchFormData();
    }
  }, [mode, formId]);

  // Persist sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('formBuilderSidebarOpen', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen]);

  const fetchFormData = async () => {
    if (!formId) return;
    
    try {
      setIsLoading(true);
      const form = await getCheckInForm(formId);
      setFormTitle(form.title);
      setFormDescription(form.description || "");
      
      // Convert CheckInFormField to Question format
      const convertedQuestions: Question[] = form.form_schema.fields.map((field, index) => ({
        id: field.id,
        question_text: field.label,
        question_type: convertFieldTypeToQuestionType(field.type),
        is_required: field.required,
        order_index: index,
        config: field.options ? { options: field.options, allow_multiple: false, allow_other: false } : {},
      }));
      
      setQuestions(convertedQuestions);
    } catch (error: any) {
      console.error("Failed to load form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load form",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertFieldTypeToQuestionType = (fieldType: string): Question["question_type"] => {
    switch (fieldType) {
      case "text":
        return "short_text";
      case "textarea":
        return "long_text";
      case "select":
        return "multiple_choice";
      case "number":
        return "number";
      case "file":
        return "file_upload";
      default:
        return "short_text";
    }
  };

  const convertQuestionTypeToFieldType = (questionType: Question["question_type"]): string => {
    switch (questionType) {
      case "short_text":
        return "text";
      case "long_text":
        return "textarea";
      case "multiple_choice":
        return "select";
      case "number":
        return "number";
      case "file_upload":
        return "file";
      default:
        return "text";
    }
  };

  const handleSaveForm = async () => {
    if (!formTitle.trim()) {
      toast({
        title: "Error",
        description: "Form title is required",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Convert questions to CheckInFormField format
      const fields: CheckInFormField[] = questions.map((q) => ({
        id: q.id,
        type: convertQuestionTypeToFieldType(q.question_type) as any,
        label: q.question_text,
        required: q.is_required,
        ...(q.question_type === "multiple_choice" && q.config?.options && {
          options: q.config.options,
        }),
      }));

      if (mode === "create" && initialMetadata) {
        // Create new form
        const formData = {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          form_type: initialMetadata.form_type,
          ...(initialMetadata.packages && initialMetadata.packages.length > 0 && { package: initialMetadata.packages[0] }),
          form_schema: { fields },
          is_active: true,
          schedule_data: initialMetadata.schedule_data,
        };

        const createdForm = await createCheckInForm(formData);

        toast({
          title: "Success",
          description: "Form created successfully",
        });

        // Call onFormCreated with the new form ID
        if (onFormCreated && createdForm?.id) {
          onFormCreated(createdForm.id);
        }

        onBack();
      } else if (mode === "edit" && formId) {
        // Update existing form
        await updateCheckInForm(formId, {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          form_schema: { fields },
        });

        toast({
          title: "Success",
          description: "Form updated successfully",
        });
      }
    } catch (error: any) {
      console.error("Failed to save form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save form",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = (type: Question["question_type"]) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: "New Question",
      question_type: type,
      is_required: false,
      order_index: questions.length,
      config: type === "multiple_choice" 
        ? { options: ["Option 1"], allow_multiple: false, allow_other: false } 
        : {},
    };

    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newQuestion.id);
    
    toast({
      title: "Success",
      description: "Question added successfully",
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    if (selectedQuestion === id) {
      setSelectedQuestion(null);
    }
    
    toast({
      title: "Success",
      description: "Question deleted successfully",
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    setQuestions(updatedItems);
    
    toast({
      title: "Success",
      description: "Questions reordered",
    });
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-8 shrink-0 border-b border-border/50">
          <Button variant="outline" onClick={onBack} className="hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading form...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-8 shrink-0 border-b border-border/50">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
          
          <Button 
            onClick={handleSaveForm} 
            size="lg" 
            disabled={isSaving}
            className="px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              mode === "create" ? (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Create Form
                </>
              ) : (
                "Save Changes"
              )
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          {/* Left Column - Form Details & Questions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Details Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent pb-4">
                <CardTitle className="text-xl font-bold">Form Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-semibold text-foreground/90">Form Title</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="mt-2 h-11 border-border/60 focus:border-primary/50 transition-colors"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-semibold text-foreground/90">Description</Label>
                  <Textarea
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="mt-2 min-h-[90px] border-border/60 focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
                {initialMetadata && (
                  <div className="pt-4 border-t border-border/50 space-y-3">
                    <div className="space-y-2">
                      <span className="font-semibold text-sm text-foreground/90">Packages:</span>
                      <div className="flex flex-wrap gap-2">
                        {initialMetadata.package_names && initialMetadata.package_names.length > 0 ? (
                          initialMetadata.package_names.map((name, index) => (
                            <Badge key={index} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">N/A</Badge>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground/90">📅 Schedule:</span>{" "}
                        <span className="text-muted-foreground">
                          {initialMetadata.schedule_data.schedule_type === "SAME_DAY" 
                            ? `Every ${initialMetadata.schedule_data.day_of_week} at ${initialMetadata.schedule_data.time}` 
                            : `Individual days at ${initialMetadata.schedule_data.time}`}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Questions Card */}
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent pb-4">
                <CardTitle className="text-xl font-bold">Questions</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questions">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {questions.map((question, index) => (
                          <Draggable key={question.id} draggableId={question.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`group p-4 border rounded-xl flex items-center gap-3 transition-all duration-200 ${
                                  selectedQuestion === question.id 
                                    ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md ring-2 ring-primary/20" 
                                    : "hover:border-primary/50 hover:shadow-md hover:bg-accent/30"
                                } ${
                                  snapshot.isDragging ? "shadow-xl ring-2 ring-primary/30 scale-105" : ""
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div 
                                  className="flex-1 cursor-pointer" 
                                  onClick={() => {
                                    setSelectedQuestion(question.id);
                                    // Only open sidebar if it's not already open
                                    if (!sidebarOpen) {
                                      setSidebarOpen(true);
                                    }
                                  }}
                                >
                                  <div className="font-semibold mb-2 leading-relaxed text-foreground group-hover:text-primary transition-colors">
                                    {question.question_text}
                                  </div>
                                  <div className="flex gap-2 items-center">
                                    <Badge className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                                      {QUESTION_TYPE_LABELS[question.question_type]}
                                    </Badge>
                                    {question.is_required && (
                                      <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/30">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {questions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No questions yet. Add your first question below.</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-sm font-bold mb-4 text-foreground/90 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <span>Add Question</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("short_text")}
                      className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Short Text
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("long_text")}
                      className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Long Text
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("multiple_choice")}
                      className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Multiple Choice
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("number")}
                      className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Number
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("file_upload")}
                      className="hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      File Upload
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Toggle Button (when closed) */}
          {!sidebarOpen && selectedQuestion && (
            <Button
              onClick={() => setSidebarOpen(true)}
              className="fixed right-0 top-1/2 -translate-y-1/2 rounded-l-lg rounded-r-none shadow-lg z-40 h-16 w-12 p-0"
              variant="default"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {/* Right Sidebar - Question Editor */}
          {selectedQuestion && (
            <div className={`fixed right-0 top-0 h-screen w-full lg:w-96 bg-background border-l shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
              <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between z-10">
                <h3 className="font-semibold text-lg">Question Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4">
                <QuestionEditor
                  question={questions.find(q => q.id === selectedQuestion)!}
                  questions={questions}
                  onUpdate={handleUpdateQuestion}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
