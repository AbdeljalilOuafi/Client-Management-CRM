"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Trash2, 
  Type, 
  AlignLeft, 
  ListChecks, 
  Hash, 
  Upload,
  GripVertical 
} from "lucide-react";

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

const QUESTION_TYPE_CONFIG: Record<Question["question_type"], { label: string; icon: React.ReactNode; color: string }> = {
  short_text: { label: "Short Text", icon: <Type className="h-4 w-4" />, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  long_text: { label: "Long Text", icon: <AlignLeft className="h-4 w-4" />, color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  multiple_choice: { label: "Multiple Choice", icon: <ListChecks className="h-4 w-4" />, color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  number: { label: "Number", icon: <Hash className="h-4 w-4" />, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  file_upload: { label: "File Upload", icon: <Upload className="h-4 w-4" />, color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, questions, onUpdate }) => {
  const [localQuestion, setLocalQuestion] = useState<Question>(question);

  // Update local state when question prop changes
  React.useEffect(() => {
    setLocalQuestion(question);
  }, [question]);

  const handleUpdate = (updates: Partial<Question>) => {
    const updated = { ...localQuestion, ...updates };
    setLocalQuestion(updated);
    onUpdate(updated);
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

  const typeConfig = QUESTION_TYPE_CONFIG[localQuestion.question_type];

  return (
    <div className="space-y-5">
      {/* Question Type Badge */}
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={`${typeConfig.color} gap-1.5 px-2.5 py-1`}
        >
          {typeConfig.icon}
          {typeConfig.label}
        </Badge>
      </div>

      <Separator />

      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor="question_text" className="text-sm font-medium">
          Question
        </Label>
        <Textarea
          id="question_text"
          value={localQuestion.question_text}
          onChange={(e) => {
            const newText = e.target.value;
            setLocalQuestion({ ...localQuestion, question_text: newText });
            onUpdate({ ...localQuestion, question_text: newText });
          }}
          className="min-h-[80px] resize-none"
          placeholder="Enter your question..."
        />
      </div>

      {/* Required Toggle */}
      <div className="flex items-center justify-between py-1">
        <div className="space-y-0.5">
          <Label htmlFor="required" className="text-sm font-medium">Required</Label>
          <p className="text-xs text-muted-foreground">Make this question mandatory</p>
        </div>
        <Switch
          id="required"
          checked={localQuestion.is_required}
          onCheckedChange={(checked: boolean) => handleUpdate({ is_required: checked })}
        />
      </div>

      {/* Multiple Choice Options */}
      {localQuestion.question_type === "multiple_choice" && (
        <>
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Answer Options</Label>
              <span className="text-xs text-muted-foreground">
                {localQuestion.config?.options?.length || 0} options
              </span>
            </div>
            
            <div className="space-y-2">
              {localQuestion.config?.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center gap-2 group">
                  <div className="text-muted-foreground/50">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <Input
                    value={option}
                    onChange={(e) => handleUpdateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    onClick={() => handleDeleteOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddOption}
              className="w-full gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Option
            </Button>
          </div>

          <Separator />

          {/* Multiple Choice Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Selection Settings</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow_multiple" className="text-sm">Allow Multiple</Label>
                <p className="text-xs text-muted-foreground">Let users select more than one</p>
              </div>
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow_other" className="text-sm">Allow &quot;Other&quot;</Label>
                <p className="text-xs text-muted-foreground">Add a custom text option</p>
              </div>
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
          </div>
        </>
      )}

      {/* File Upload Info */}
      {localQuestion.question_type === "file_upload" && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-sm font-medium">Upload Settings</Label>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max file size</span>
                <span className="font-medium">20 MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Accepted types</span>
                <span className="font-medium">Images</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max files</span>
                <span className="font-medium">5</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Number Info */}
      {localQuestion.question_type === "number" && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-sm font-medium">Number Settings</Label>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format</span>
                <span className="font-medium">Decimal (up to 2 places)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Range</span>
                <span className="font-medium">0 - 500</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Short Text Info */}
      {localQuestion.question_type === "short_text" && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-sm font-medium">Text Settings</Label>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max length</span>
                <span className="font-medium">200 characters</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Long Text Info */}
      {localQuestion.question_type === "long_text" && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-sm font-medium">Text Settings</Label>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max length</span>
                <span className="font-medium">2000 characters</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionEditor;
