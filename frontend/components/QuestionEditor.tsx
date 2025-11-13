"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  question_type: "file_upload" | "short_text" | "long_text" | "multiple_choice" | "number";
  is_required: boolean;
  order_index: number;
  config: any;
}

interface QuestionEditorProps {
  question: Question;
  questions: Question[];
  onUpdate: (question: Question) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, questions, onUpdate }) => {
  const { toast } = useToast();
  const [localQuestion, setLocalQuestion] = useState<Question>(question);

  // Update local state when question prop changes
  React.useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  const handleUpdate = (updates: Partial<Question>) => {
    const updated = { ...localQuestion, ...updates };
    setLocalQuestion(updated);
    onUpdate(updated);
    
    toast({
      title: "Success",
      description: "Question updated",
    });
  };

  const handleAddOption = () => {
    const options = localQuestion.config?.options || [];
    handleUpdate({
      config: {
        ...localQuestion.config,
        options: [...options, `Option ${options.length + 1}`],
      },
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const options = [...(localQuestion.config?.options || [])];
    options[index] = value;
    handleUpdate({
      config: {
        ...localQuestion.config,
        options,
      },
    });
  };

  const handleDeleteOption = (index: number) => {
    const options = [...(localQuestion.config?.options || [])];
    options.splice(index, 1);
    handleUpdate({
      config: {
        ...localQuestion.config,
        options,
      },
    });
  };

  const handleAddLogic = (optionIndex: number) => {
    const logic = localQuestion.config?.logic || {};
    handleUpdate({
      config: {
        ...localQuestion.config,
        logic: {
          ...logic,
          [optionIndex]: { action: "show", targetQuestions: [] },
        },
      },
    });
  };

  const handleUpdateLogic = (optionIndex: number, targetQuestionId: string) => {
    const logic = localQuestion.config?.logic || {};
    handleUpdate({
      config: {
        ...localQuestion.config,
        logic: {
          ...logic,
          [optionIndex]: { 
            action: "show", 
            targetQuestions: targetQuestionId ? [targetQuestionId] : [] 
          },
        },
      },
    });
  };

  const availableQuestions = questions.filter(
    (q) => q.order_index > localQuestion.order_index
  );

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Question Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="question_text">Question Text</Label>
          <Input
            id="question_text"
            value={localQuestion.question_text}
            onChange={(e) => setLocalQuestion({ ...localQuestion, question_text: e.target.value })}
            onBlur={() => handleUpdate({ question_text: localQuestion.question_text })}
            className="mt-1.5"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <Label htmlFor="required">Required</Label>
          <Switch
            id="required"
            checked={localQuestion.is_required}
            onCheckedChange={(checked: boolean) => handleUpdate({ is_required: checked })}
          />
        </div>

        {localQuestion.question_type === "multiple_choice" && (
          <>
            <div className="space-y-3 pt-2">
              <Label>Options</Label>
              {localQuestion.config?.options?.map((option: string, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleUpdateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Conditional Logic */}
                  {localQuestion.config?.logic?.[index] ? (
                    <div className="ml-4 p-3 border rounded-lg space-y-2 bg-muted/50">
                      <Label className="text-xs text-muted-foreground">
                        When selected, show these questions:
                      </Label>
                      <Select
                        value={localQuestion.config.logic[index].targetQuestions?.[0] || ""}
                        onValueChange={(value) => handleUpdateLogic(index, value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select question..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableQuestions.map((q) => (
                            <SelectItem key={q.id} value={q.id}>
                              {q.question_text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddLogic(index)}
                      className="ml-4 h-8 text-xs"
                    >
                      Add Conditional Logic
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <Label htmlFor="allow_multiple">Allow Multiple Selections</Label>
              <Switch
                id="allow_multiple"
                checked={localQuestion.config?.allow_multiple || false}
                onCheckedChange={(checked: boolean) =>
                  handleUpdate({
                    config: { ...localQuestion.config, allow_multiple: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="allow_other">Allow &quot;Other&quot; Option</Label>
              <Switch
                id="allow_other"
                checked={localQuestion.config?.allow_other || false}
                onCheckedChange={(checked: boolean) =>
                  handleUpdate({
                    config: { ...localQuestion.config, allow_other: checked },
                  })
                }
              />
            </div>
          </>
        )}

        {localQuestion.question_type === "file_upload" && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
            Maximum file size: 20MB
          </div>
        )}

        {localQuestion.question_type === "number" && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
            Format: Numbers with up to 2 decimal places
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionEditor;
