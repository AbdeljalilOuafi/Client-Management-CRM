"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  GripVertical, 
  Trash2, 
  X, 
  Loader2, 
  Eye,
  Save,
  Type,
  AlignLeft,
  ListChecks,
  Hash,
  Upload,
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import QuestionEditor from "@/components/QuestionEditor";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormMetadata } from "@/components/CreateFormDialog";
import { createCheckInForm, getCheckInForm, updateCheckInForm, CheckInFormField } from "@/lib/api/checkin-forms";

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// CONSTANTS
// ============================================================================

const QUESTION_TYPE_LABELS: Record<Question["question_type"], string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Multiple Choice",
  number: "Number",
  file_upload: "File Upload",
};

const QUESTION_TYPE_ICONS: Record<Question["question_type"], React.ReactNode> = {
  short_text: <Type className="h-5 w-5" />,
  long_text: <AlignLeft className="h-5 w-5" />,
  multiple_choice: <ListChecks className="h-5 w-5" />,
  number: <Hash className="h-5 w-5" />,
  file_upload: <Upload className="h-5 w-5" />,
};

// Component library items for the left sidebar
const COMPONENT_LIBRARY = [
  {
    category: "Form Components",
    items: [
      { type: "short_text" as const, label: "Short Text", icon: <Type className="h-6 w-6" /> },
      { type: "long_text" as const, label: "Long Text", icon: <AlignLeft className="h-6 w-6" /> },
      { type: "multiple_choice" as const, label: "Multiple Choice", icon: <ListChecks className="h-6 w-6" /> },
      { type: "number" as const, label: "Number", icon: <Hash className="h-6 w-6" /> },
      { type: "file_upload" as const, label: "File Upload", icon: <Upload className="h-6 w-6" /> },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getDefaultsForType = (questionType: Question["question_type"]) => {
  switch (questionType) {
    case "file_upload":
      return {
        question_text: "Upload your progress photos",
        config: {
          accepted_types: ["image/*"],
          max_size_mb: 20,
          max_files: 5,
        },
      };
    case "short_text":
      return {
        question_text: "How are you feeling today?",
        config: {
          placeholder: "Enter your answer...",
          max_length: 200,
        },
      };
    case "long_text":
      return {
        question_text: "Describe your progress this week",
        config: {
          placeholder: "Share your thoughts in detail...",
          max_length: 2000,
        },
      };
    case "multiple_choice":
      return {
        question_text: "How would you rate your energy level?",
    config: {
      options: ["Low", "Medium", "High", "Very High"],
      allow_multiple: false,
      allow_other: false,
    },
      };
    case "number":
      return {
        question_text: "What is your current weight (kg)?",
        config: {
          placeholder: "Enter a number",
          min: 0,
          max: 500,
          decimal_places: 1,
        },
      };
    default:
      return {
        question_text: "New Question",
    config: {},
      };
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

// ============================================================================
// COMPONENT LIBRARY SIDEBAR (Left Panel)
// ============================================================================

interface ComponentLibraryProps {
  onAddQuestion: (type: Question["question_type"]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function ComponentLibrary({ onAddQuestion, searchQuery, onSearchChange }: ComponentLibraryProps) {
  const filteredLibrary = COMPONENT_LIBRARY.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  return (
    <div className="h-full flex flex-col bg-muted/30 border-r border-border/50">
      {/* Search */}
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 bg-background border-border/60"
          />
        </div>
      </div>

      {/* Component Grid */}
      <ScrollArea className="flex-1 p-4">
        {filteredLibrary.map((category) => (
          <div key={category.category} className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {category.category}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {category.items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => onAddQuestion(item.type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="text-muted-foreground group-hover:text-primary transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium text-center text-foreground/80 group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredLibrary.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No components found
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// INSERT POINT (Between Questions)
// ============================================================================

interface InsertPointProps {
  onInsert: (type: Question["question_type"]) => void;
  isHidden?: boolean;
}

function InsertPoint({ onInsert, isHidden }: InsertPointProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isHidden) {
    return <div className="h-3" />;
  }

  return (
    <div 
      className="relative py-3 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Collapsed state - just plus button */}
      <div className={`flex items-center gap-2 transition-all duration-200 ${isHovered ? 'opacity-0 scale-95' : 'opacity-100'}`}>
        <div className="flex-1 h-px bg-border/40" />
        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
          <Plus className="h-4 w-4" />
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {/* Expanded state - shows all options inline */}
      <div 
        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-0 px-2 py-1.5 bg-background border border-border/60 rounded-xl shadow-lg">
          {/* Drag handle icon on the left */}
          <div className="px-2 py-1.5 text-muted-foreground/40">
            <GripVertical className="h-4 w-4" />
          </div>
          
          {/* Question type buttons */}
          {COMPONENT_LIBRARY[0].items.map((item, idx) => (
            <button
              key={item.type}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInsert(item.type);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all whitespace-nowrap"
            >
              <span className="[&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SORTABLE QUESTION CARD (Canvas Item with @dnd-kit)
// ============================================================================

interface SortableQuestionCardProps {
  question: Question;
  isSelected: boolean;
  justSaved: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableQuestionCard({ 
  question, 
  isSelected, 
  justSaved,
  onSelect, 
  onDelete,
}: SortableQuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group rounded-xl border-2 border-dashed transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging
          ? "shadow-2xl scale-[1.02] border-primary ring-2 ring-primary/30 opacity-90"
          : justSaved
          ? "border-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5 shadow-lg ring-2 ring-green-500/30"
          : isSelected
          ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
          : "border-border/60 bg-background hover:border-primary/40 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      {/* Card Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <div className="p-1 rounded text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {QUESTION_TYPE_ICONS[question.question_type]}
          </div>
          <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0">
            {QUESTION_TYPE_LABELS[question.question_type]}
          </Badge>
          {question.is_required && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              Required
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Card Body - Live Preview */}
      <div className="p-4">
        <p className="font-medium text-foreground mb-3 leading-relaxed">
          {question.question_text}
        </p>

        {/* Preview based on question type */}
        {question.question_type === "short_text" && (
          <Input 
            placeholder="Short answer text" 
            disabled 
            className="bg-muted/30 border-border/40"
          />
        )}

        {question.question_type === "long_text" && (
          <Textarea 
            placeholder="Long answer text" 
            disabled 
            className="bg-muted/30 border-border/40 min-h-[80px] resize-none"
          />
        )}

        {question.question_type === "multiple_choice" && (
          <div className="space-y-2">
            {(question.config?.options || ["Option 1", "Option 2"]).slice(0, 4).map((option: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-border/60 bg-muted/30" />
                <span className="text-sm text-muted-foreground">{option}</span>
              </div>
            ))}
            {(question.config?.options?.length || 0) > 4 && (
              <span className="text-xs text-muted-foreground">
                +{question.config.options.length - 4} more options
              </span>
            )}
          </div>
        )}

        {question.question_type === "number" && (
          <Input 
            type="number" 
            placeholder="0" 
            disabled 
            className="bg-muted/30 border-border/40 w-32"
          />
        )}

        {question.question_type === "file_upload" && (
          <div className="border-2 border-dashed border-border/40 rounded-lg p-4 bg-muted/20 text-center">
            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click or drag to upload</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN FORM BUILDER COMPONENT
// ============================================================================

export default function FormBuilder({ mode, formId, initialMetadata, onBack, onFormCreated }: FormBuilderProps) {
  const { toast } = useToast();
  
  // Form state
  const [formTitle, setFormTitle] = useState(initialMetadata?.title || "Weekly Check-in");
  const [formDescription, setFormDescription] = useState(initialMetadata?.description || "Standard weekly progress check-in");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [draftQuestion, setDraftQuestion] = useState<Question | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [justSavedQuestionId, setJustSavedQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMetadataOpen, setIsMetadataOpen] = useState(true);
  const [isDraggingQuestion, setIsDraggingQuestion] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Fetch form data in edit mode
  useEffect(() => {
    if (mode === "edit" && formId) {
      fetchFormData();
    }
  }, [mode, formId]);

  // Initialize draft question when selecting a question
  useEffect(() => {
    if (selectedQuestion) {
      const question = questions.find(q => q.id === selectedQuestion);
      if (question) {
        setDraftQuestion({ ...question });
      }
    } else {
      setDraftQuestion(null);
    }
  }, [selectedQuestion, questions]);

  // ============================================================================
  // API HANDLERS
  // ============================================================================

  const fetchFormData = async () => {
    if (!formId) return;
    
    try {
      setIsLoading(true);
      const form = await getCheckInForm(formId);
      setFormTitle(form.title);
      setFormDescription(form.description || "");
      
      const convertedQuestions: Question[] = form.form_schema.fields.map((field, index) => ({
        id: field.id,
        question_text: field.label,
        question_type: convertFieldTypeToQuestionType(field.type),
        is_required: field.required,
        order_index: index,
        config: field.options 
          ? { 
              options: field.options, 
              allow_multiple: (field as any).allow_multiple || false, 
              allow_other: (field as any).allow_other || false 
            } 
          : {},
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
      const fields: CheckInFormField[] = questions.map((q) => ({
        id: q.id,
        type: convertQuestionTypeToFieldType(q.question_type) as any,
        label: q.question_text,
        required: q.is_required,
        ...(q.question_type === "multiple_choice" && q.config?.options && {
          options: q.config.options,
          allow_multiple: q.config.allow_multiple || false,
          allow_other: q.config.allow_other || false,
        }),
      }));

      if (mode === "create" && initialMetadata) {
        let scheduleData = undefined;
        if (initialMetadata.form_type === "checkins" && initialMetadata.schedule_data) {
          scheduleData = initialMetadata.schedule_data;
        }
        
        const formData = {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          form_type: initialMetadata.form_type,
          ...(initialMetadata.packages && initialMetadata.packages.length > 0 && { package: initialMetadata.packages[0] }),
          form_schema: { fields },
          is_active: true,
          ...(scheduleData && { schedule_data: scheduleData }),
        };

        console.log("[FormBuilder] Creating form with data:", JSON.stringify(formData, null, 2));
        const createdForm = await createCheckInForm(formData);
        console.log("[FormBuilder] Create response:", createdForm);

        toast({
          title: "Success",
          description: "Form created successfully",
        });

        if (onFormCreated && createdForm?.id) {
          onFormCreated(createdForm.id);
        }

        onBack();
      } else if (mode === "edit" && formId) {
        const updateData = {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          form_schema: { fields },
        };
        
        console.log("[FormBuilder] Updating form:", formId, updateData);
        const updatedForm = await updateCheckInForm(formId, updateData);
        console.log("[FormBuilder] Update response:", updatedForm);

        toast({
          title: "Success",
          description: "Form updated successfully",
        });
        
        onBack();
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

  // ============================================================================
  // QUESTION HANDLERS
  // ============================================================================

  const handleAddQuestion = (type: Question["question_type"], insertAtIndex?: number) => {
    const defaults = getDefaultsForType(type);
    
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: defaults.question_text,
      question_type: type,
      is_required: false,
      order_index: insertAtIndex ?? questions.length,
      config: defaults.config,
    };

    if (insertAtIndex !== undefined) {
      const newQuestions = [...questions];
      newQuestions.splice(insertAtIndex, 0, newQuestion);
      const updatedQuestions = newQuestions.map((q, idx) => ({ ...q, order_index: idx }));
      setQuestions(updatedQuestions);
    } else {
    setQuestions([...questions, newQuestion]);
    }
    
    setSelectedQuestion(newQuestion.id);
    
    toast({
      title: "Question Added",
      description: `${QUESTION_TYPE_LABELS[type]} question added.`,
    });
  };

  const handleDeleteClick = (question: Question) => {
    setQuestionToDelete(question);
  };

  const handleConfirmDelete = () => {
    if (!questionToDelete) return;
    
    setQuestions(questions.filter((q) => q.id !== questionToDelete.id));
    if (selectedQuestion === questionToDelete.id) {
      setSelectedQuestion(null);
    }
    
    toast({
      title: "Question Deleted",
      description: "Question removed from form",
    });
    
    setQuestionToDelete(null);
  };

  const handleCancelDelete = () => {
    setQuestionToDelete(null);
  };

  // @dnd-kit sensors for mouse/touch and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setIsDraggingQuestion(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDraggingQuestion(false);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    const newQuestions = arrayMove(questions, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order_index: index,
    }));

    setQuestions(newQuestions);
  };

  const handleUpdateDraftQuestion = (updatedQuestion: Question) => {
    setDraftQuestion(updatedQuestion);
  };

  const handleSaveEdit = () => {
    if (draftQuestion) {
      const savedId = draftQuestion.id;
      setQuestions(questions.map(q => q.id === savedId ? draftQuestion : q));
      
      setJustSavedQuestionId(savedId);
      setTimeout(() => setJustSavedQuestionId(null), 1500);
      
      toast({
        title: "Question Updated",
        description: "Changes saved successfully",
      });
    }
  };

  const handleCancelEdit = () => {
    setSelectedQuestion(null);
    setDraftQuestion(null);
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
  return (
      <div className="h-full flex flex-col bg-background">
        <div className="h-16 border-b border-border/50 px-4 flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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

  // ============================================================================
  // MAIN RENDER - 3 PANEL LAYOUT
  // ============================================================================

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Top Action Bar */}
      <div className="h-16 bg-background border-b border-border/50 px-4 flex items-center justify-between shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Forms</span>
        </Button>

        <div className="flex items-center gap-2">
          {/* Preview button - commented out for now
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          */}
          
          <Button 
            onClick={handleSaveForm} 
            size="sm"
            disabled={isSaving}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{mode === "create" ? "Create" : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Component Library */}
        <div className="w-64 shrink-0 hidden lg:block">
          <ComponentLibrary
            onAddQuestion={handleAddQuestion}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="max-w-2xl mx-auto p-6">
              {/* Form Metadata - Collapsible Header */}
              <Collapsible open={isMetadataOpen} onOpenChange={setIsMetadataOpen}>
                <Card className="mb-6 border-border/60 shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Form Details</CardTitle>
                        {isMetadataOpen ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
              </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                <div>
                        <Label htmlFor="title" className="text-sm font-medium">Form Title</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                          className="mt-1.5"
                          placeholder="Enter form title..."
                  />
                </div>
                <div>
                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                          className="mt-1.5 min-h-[80px] resize-none"
                          placeholder="Describe your form..."
                  />
                </div>
                {initialMetadata && (
                        <div className="pt-3 border-t border-border/50 space-y-2">
                          {initialMetadata.package_names && initialMetadata.package_names.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                              <span className="text-sm font-medium text-muted-foreground">Packages:</span>
                              {initialMetadata.package_names.map((name, index) => (
                                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                              {name}
                            </Badge>
                              ))}
                      </div>
                          )}
                    {initialMetadata.schedule_data && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Schedule:</span>{" "}
                            {"schedule_type" in initialMetadata.schedule_data
                              ? (initialMetadata.schedule_data.schedule_type === "SAME_DAY" 
                                  ? `Every ${initialMetadata.schedule_data.day_of_week} at ${initialMetadata.schedule_data.time}` 
                                  : `Individual days at ${initialMetadata.schedule_data.time}`)
                              : `Every ${initialMetadata.schedule_data.interval_count} ${initialMetadata.schedule_data.interval_type === "weekly" ? "week(s)" : "month(s)"} at ${initialMetadata.schedule_data.time}`
                            }
                        </p>
                    )}
                  </div>
                )}
              </CardContent>
                  </CollapsibleContent>
            </Card>
              </Collapsible>

              {/* Questions Canvas with @dnd-kit */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map(q => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0">
                    {/* Insert point at the very top */}
                    {questions.length > 0 && (
                      <InsertPoint 
                        onInsert={(type) => handleAddQuestion(type, 0)} 
                        isHidden={isDraggingQuestion}
                      />
                    )}
                    
                    {questions.map((question, index) => (
                      <React.Fragment key={question.id}>
                        <SortableQuestionCard
                          question={question}
                          isSelected={selectedQuestion === question.id}
                          justSaved={justSavedQuestionId === question.id}
                          onSelect={() => setSelectedQuestion(question.id)}
                          onDelete={() => handleDeleteClick(question)}
                        />
                        
                        {/* Insert point after each question */}
                        <InsertPoint 
                          onInsert={(type) => handleAddQuestion(type, index + 1)} 
                          isHidden={isDraggingQuestion}
                        />
                      </React.Fragment>
                    ))}
                                  </div>
                </SortableContext>
              </DndContext>

              {/* Empty State */}
                {questions.length === 0 && (
                <div className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center bg-background/80 backdrop-blur-sm">
                  <div className="max-w-md mx-auto">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/10">
                      <Plus className="h-7 w-7 text-primary" />
                                </div>
                    <h3 className="font-semibold text-xl mb-2">Build your form</h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                      Click a component from the left sidebar or choose one below to get started
                    </p>
                    
                    {/* Component buttons grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {COMPONENT_LIBRARY[0].items.map((item) => (
                        <button
                          key={item.type}
                          onClick={() => handleAddQuestion(item.type)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all duration-200 group"
                        >
                          <div className="text-muted-foreground group-hover:text-primary transition-colors [&>svg]:h-5 [&>svg]:w-5">
                            {item.icon}
                              </div>
                          <span className="text-xs font-medium text-foreground/70 group-hover:text-primary transition-colors">
                            {item.label}
                          </span>
                        </button>
                      ))}
                </div>
          </div>
                      </div>
                    )}

                  </div>
          </ScrollArea>
          </div>

        {/* Right Panel - Question Configuration */}
        <div className="w-80 shrink-0 border-l border-border/50 bg-background hidden md:flex flex-col">
          {selectedQuestion && draftQuestion ? (
            <>
              {/* Panel Header */}
              <div className="h-14 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
                <h3 className="font-semibold">Question Settings</h3>
                    <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                  className="h-8 w-8 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                    </Button>
              </div>
              
              {/* Panel Content */}
              <ScrollArea className="flex-1 p-4">
                <QuestionEditor
                  question={draftQuestion}
                  questions={questions}
                  onUpdate={handleUpdateDraftQuestion}
                />
              </ScrollArea>
              
              {/* Panel Footer */}
              <div className="p-4 border-t border-border/50 flex gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                  onClick={handleCancelEdit}
                  className="flex-1"
                    >
                  Cancel
                    </Button>
                    <Button 
                  onClick={handleSaveEdit}
                  className="flex-1"
                >
                  Apply
                    </Button>
                  </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Type className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Select a question to edit its settings
                </p>
          </div>
            </div>
          )}
        </div>
      </div>
          
      {/* Mobile Bottom Sheet for Question Editor */}
          {selectedQuestion && draftQuestion && (
        <div className="md:hidden fixed inset-0 z-50">
            <div 
            className="absolute inset-0 bg-black/50" 
                  onClick={handleCancelEdit}
            />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="h-14 px-4 flex items-center justify-between border-b shrink-0">
              <h3 className="font-semibold">Question Settings</h3>
              <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
                </Button>
              </div>
            <ScrollArea className="flex-1 p-4">
                <QuestionEditor
                  question={draftQuestion}
                  questions={questions}
                  onUpdate={handleUpdateDraftQuestion}
                />
            </ScrollArea>
            <div className="p-4 border-t flex gap-2 shrink-0">
              <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                  Cancel
                </Button>
              <Button onClick={handleSaveEdit} className="flex-1">
                Apply
                </Button>
      </div>
              </div>
            </div>
          )}
          
      {/* Delete Question Confirmation Dialog */}
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question?
              {questionToDelete && (
                <span className="block mt-2 p-3 bg-muted rounded-lg text-foreground font-medium">
                  "{questionToDelete.question_text}"
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form Preview Dialog - commented out for now
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Form Preview</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  This is how clients will see this form
                </p>
              </div>
              <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as "desktop" | "mobile")}>
                <TabsList>
                  <TabsTrigger value="desktop" className="gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="hidden sm:inline">Desktop</span>
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Mobile</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </DialogHeader>

          <div className={cn(
            "flex items-center justify-center bg-muted/30 overflow-auto flex-1",
            previewMode === "mobile" ? "p-8" : "p-6"
          )}>
            <div 
              className={cn(
                "transition-all duration-300 bg-background rounded-lg shadow-2xl overflow-hidden mx-auto",
                previewMode === "mobile" 
                  ? "w-[375px] h-[667px] border-8 border-border" 
                  : "w-full max-w-3xl border border-border"
              )}
            >
              <ScrollArea className={cn(
                "w-full",
                previewMode === "mobile" ? "h-full" : "max-h-[calc(90vh-200px)]"
              )}>
                <div className={cn(
                  "space-y-6",
                  previewMode === "mobile" ? "p-4" : "p-8"
                )}>
                  <div className="space-y-2">
                    <h2 className={cn(
                      "font-bold tracking-tight text-foreground",
                      previewMode === "mobile" ? "text-xl" : "text-2xl"
                    )}>
                      {formTitle || "Untitled Form"}
                    </h2>
                    {formDescription && (
                      <p className={cn(
                        "text-muted-foreground",
                        previewMode === "mobile" ? "text-sm" : "text-base"
                      )}>
                        {formDescription}
                      </p>
                    )}
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No questions added yet</p>
                    </div>
                  ) : (
                    <div className={cn(
                      "space-y-6",
                      previewMode === "mobile" ? "space-y-4" : ""
                    )}>
                      {questions.map((question, index) => (
                        <div 
                          key={question.id} 
                          className={cn(
                            "space-y-2",
                            previewMode === "mobile" ? "space-y-1.5" : ""
                          )}
                        >
                          <Label className={cn(
                            "font-medium",
                            previewMode === "mobile" ? "text-sm" : "text-base"
                          )}>
                            {question.question_text}
                            {question.is_required && (
                              <span className="text-destructive ml-1">*</span>
                            )}
                          </Label>

                          {question.question_type === "short_text" && (
                            <Input 
                              placeholder="Your answer..." 
                              disabled
                              className={cn(
                                "bg-muted/30",
                                previewMode === "mobile" ? "h-10 text-sm" : "h-11"
                              )}
                            />
                          )}

                          {question.question_type === "long_text" && (
                            <Textarea 
                              placeholder="Your answer..." 
                              disabled
                              className={cn(
                                "bg-muted/30 resize-none",
                                previewMode === "mobile" ? "min-h-[80px] text-sm" : "min-h-[100px]"
                              )}
                            />
                          )}

                          {question.question_type === "number" && (
                            <Input 
                              type="number" 
                              placeholder="0" 
                              disabled
                              className={cn(
                                "bg-muted/30 w-32",
                                previewMode === "mobile" ? "h-10 text-sm" : "h-11"
                              )}
                            />
                          )}

                          {question.question_type === "multiple_choice" && (
                            <div className={cn(
                              "space-y-2",
                              previewMode === "mobile" ? "space-y-1.5" : ""
                            )}>
                              {(question.config?.options || []).map((option: string, optIdx: number) => (
                                <div 
                                  key={optIdx} 
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border bg-muted/20",
                                    previewMode === "mobile" ? "p-2.5 gap-2" : ""
                                  )}
                                >
                                  <div className={cn(
                                    "rounded-full border-2 border-muted-foreground/30",
                                    previewMode === "mobile" ? "h-4 w-4" : "h-5 w-5"
                                  )} />
                                  <span className={cn(
                                    "text-muted-foreground",
                                    previewMode === "mobile" ? "text-sm" : ""
                                  )}>
                                    {option}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.question_type === "file_upload" && (
                            <div className={cn(
                              "border-2 border-dashed rounded-lg text-center bg-muted/20",
                              previewMode === "mobile" ? "p-4" : "p-6"
                            )}>
                              <Upload className={cn(
                                "mx-auto text-muted-foreground mb-2",
                                previewMode === "mobile" ? "h-6 w-6" : "h-8 w-8"
                              )} />
                              <p className={cn(
                                "text-muted-foreground",
                                previewMode === "mobile" ? "text-xs" : "text-sm"
                              )}>
                                Click or drag files to upload
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {questions.length > 0 && (
                    <div className="pt-4">
                      <Button 
                        disabled 
                        className={cn(
                          "w-full",
                          previewMode === "mobile" ? "h-10" : "h-12"
                        )}
                      >
                        Submit
                      </Button>
                      <p className={cn(
                        "text-center text-muted-foreground mt-2",
                        previewMode === "mobile" ? "text-[10px]" : "text-xs"
                      )}>
                        Preview mode - submit is disabled
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      */}
    </div>
  );
}
