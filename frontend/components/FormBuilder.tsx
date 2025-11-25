"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, GripVertical, Trash2, Settings, X, ChevronLeft } from "lucide-react";
import QuestionEditor from "@/components/QuestionEditor";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  question_text: string;
  question_type: "file_upload" | "short_text" | "long_text" | "multiple_choice" | "number";
  is_required: boolean;
  order_index: number;
  config: any;
}

interface FormBuilderProps {
  formId: string;
  onBack: () => void;
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

export default function FormBuilder({ formId, onBack }: FormBuilderProps) {
  const { toast } = useToast();
  const [formTitle, setFormTitle] = useState("Weekly Check-in");
  const [formDescription, setFormDescription] = useState("Standard weekly progress check-in");
  const [questions, setQuestions] = useState<Question[]>(INITIAL_MOCK_QUESTIONS);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  
  // Initialize sidebar state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('formBuilderSidebarOpen');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Persist sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('formBuilderSidebarOpen', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen]);

  const handleUpdateForm = () => {
    toast({
      title: "Success",
      description: "Form updated successfully",
    });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form Details & Questions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Form Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Form Title</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    onBlur={handleUpdateForm}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    onBlur={handleUpdateForm}
                    className="mt-1.5 min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Questions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questions">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {questions.map((question, index) => (
                          <Draggable key={question.id} draggableId={question.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 border rounded-lg flex items-center gap-3 transition-all duration-200 ${
                                  selectedQuestion === question.id 
                                    ? "border-primary bg-accent shadow-sm" 
                                    : "hover:border-muted-foreground/50 hover:shadow-sm"
                                } ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                }`}
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
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
                                  <div className="font-medium mb-1">{question.question_text}</div>
                                  <div className="flex gap-2 items-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {QUESTION_TYPE_LABELS[question.question_type]}
                                    </Badge>
                                    {question.is_required && (
                                      <Badge variant="outline" className="text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-destructive/10 hover:text-destructive"
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

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium mb-3">Add Question</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("short_text")}
                      className="hover:bg-accent"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Short Text
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("long_text")}
                      className="hover:bg-accent"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Long Text
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("multiple_choice")}
                      className="hover:bg-accent"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Multiple Choice
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("number")}
                      className="hover:bg-accent"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Number
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAddQuestion("file_upload")}
                      className="hover:bg-accent"
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
