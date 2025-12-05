"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, Send, User, Mail, Package, Star, ThumbsUp, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  getPublicReviewsForm,
  submitPublicReviews,
  PublicReviewsData,
  ReviewsField,
} from "@/lib/api/public-reviews";

export default function PublicReviewsPage() {
  const params = useParams();
  const reviewsUuid = params.uuid as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewsData, setReviewsData] = useState<PublicReviewsData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviewsForm();
  }, [reviewsUuid]);

  const loadReviewsForm = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPublicReviewsForm(reviewsUuid);
      setReviewsData(data);
    } catch (err: any) {
      console.error("Failed to load reviews form:", err);
      setError(err.message || "Failed to load reviews form. Please check your link.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!reviewsData) return false;

    reviewsData.form.form_schema.fields.forEach((field) => {
      if (field.required && !formValues[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }

      // Validate number/rating fields
      if ((field.type === "number" || field.type === "rating") && formValues[field.id]) {
        const value = parseFloat(formValues[field.id]);
        if (isNaN(value)) {
          newErrors[field.id] = "Please enter a valid number";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Convert number/rating fields to actual numbers
      const submissionData: Record<string, any> = {};
      reviewsData?.form.form_schema.fields.forEach((field) => {
        if (formValues[field.id] !== undefined && formValues[field.id] !== "") {
          if (field.type === "number" || field.type === "rating") {
            submissionData[field.id] = parseFloat(formValues[field.id]);
          } else {
            submissionData[field.id] = formValues[field.id];
          }
        }
      });

      await submitPublicReviews(reviewsUuid, submissionData);
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Get icon for field based on common review field names
  const getFieldIcon = (fieldId: string) => {
    const iconMap: Record<string, any> = {
      rating: Star,
      recommend: ThumbsUp,
      feedback: MessageSquare,
      comments: MessageSquare,
      experience: Star,
    };
    return iconMap[fieldId] || null;
  };

  // Render star rating component
  const renderRating = (field: ReviewsField) => {
    const value = formValues[field.id] || 0;
    const hasError = !!errors[field.id];
    const maxRating = field.max || 5;

    return (
      <div key={field.id} className="space-y-2.5">
        <Label className="text-sm font-semibold text-card-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex items-center gap-2">
          {[...Array(maxRating)].map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleFieldChange(field.id, i + 1)}
              className={`p-1 transition-all duration-200 hover:scale-110 ${
                i < value 
                  ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
                  : "text-gray-300 hover:text-yellow-200"
              }`}
              disabled={isSubmitting}
            >
              <Star className={`h-8 w-8 ${i < value ? "fill-current" : ""}`} />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {value > 0 ? `${value} / ${maxRating}` : "Select rating"}
          </span>
        </div>
        {hasError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors[field.id]}</p>}
      </div>
    );
  };

  const renderField = (field: ReviewsField) => {
    const value = formValues[field.id] || "";
    const hasError = !!errors[field.id];
    const FieldIcon = getFieldIcon(field.id);

    // Special handling for rating type
    if (field.type === "rating") {
      return renderRating(field);
    }

    switch (field.type) {
      case "number":
        return (
          <div key={field.id} className="space-y-2.5">
            <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              {FieldIcon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <FieldIcon className="h-5 w-5" />
                </div>
              )}
              <Input
                id={field.id}
                type="number"
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                min={field.min}
                max={field.max}
                className={`rounded-xl border-input ${FieldIcon ? 'pl-12' : 'pl-4'} pr-4 py-6 text-base transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent ${hasError ? "border-destructive" : ""}`}
                disabled={isSubmitting}
              />
            </div>
            {hasError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors[field.id]}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.id} className="space-y-2.5">
            <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              {FieldIcon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
                  <FieldIcon className="h-5 w-5" />
                </div>
              )}
              <Select
                value={value}
                onValueChange={(val) => handleFieldChange(field.id, val)}
                disabled={isSubmitting}
              >
                <SelectTrigger 
                  id={field.id} 
                  className={`rounded-xl border-input ${FieldIcon ? 'pl-12' : 'pl-4'} pr-4 h-14 text-base transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent ${hasError ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option} className="text-base py-3">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors[field.id]}</p>}
          </div>
        );

      case "textarea":
        return (
          <div key={field.id} className="space-y-2.5">
            <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              {FieldIcon && (
                <div className="absolute left-4 top-4 text-muted-foreground">
                  <FieldIcon className="h-5 w-5" />
                </div>
              )}
              <Textarea
                id={field.id}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                className={`min-h-[120px] rounded-xl border-input ${FieldIcon ? 'pl-12' : 'pl-4'} pr-4 py-4 text-base transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${hasError ? "border-destructive" : ""}`}
                disabled={isSubmitting}
              />
            </div>
            {hasError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors[field.id]}</p>}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.id} className="space-y-2.5">
            <div className="flex items-center space-x-3">
              <input
                id={field.id}
                type="checkbox"
                checked={value === true || value === "true"}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                className="h-5 w-5 rounded border-input text-primary focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
              <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {hasError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors[field.id]}</p>}
          </div>
        );

      case "text":
      default:
        return (
          <div key={field.id} className="space-y-2.5">
            <Label htmlFor={field.id} className="text-sm font-semibold text-card-foreground">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              {FieldIcon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <FieldIcon className="h-5 w-5" />
                </div>
              )}
              <Input
                id={field.id}
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                className={`rounded-xl border-input ${FieldIcon ? 'pl-12' : 'pl-4'} pr-4 py-6 text-base transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-transparent ${hasError ? "border-destructive" : ""}`}
                disabled={isSubmitting}
              />
            </div>
            {hasError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors[field.id]}</p>}
          </div>
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
              <Loader2 className="relative h-16 w-16 animate-spin text-primary" />
            </div>
            <p className="text-muted-foreground mt-6 text-lg font-medium">Loading your review form...</p>
            <p className="text-muted-foreground/60 text-sm mt-2">Please wait a moment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !reviewsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0">
          <CardContent className="py-16 px-6">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full"></div>
                <div className="relative bg-destructive/10 p-6 rounded-full">
                  <AlertCircle className="h-16 w-16 text-destructive" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Unable to Load Form</h2>
                <p className="text-muted-foreground max-w-md text-base">{error}</p>
              </div>
              <Button onClick={loadReviewsForm} size="lg" className="mt-4">
                <Loader2 className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-0">
          <CardContent className="py-16 px-6">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                <div className="relative bg-primary/10 p-6 rounded-full">
                  <CheckCircle2 className="h-20 w-20 text-primary animate-in zoom-in duration-500" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-bold tracking-tight text-primary">
                  Thank You!
                </h2>
                <p className="text-muted-foreground max-w-md text-lg">
                  Your feedback is greatly appreciated{reviewsData?.client.first_name ? `, ${reviewsData.client.first_name}` : ''}!
                </p>
                <p className="text-muted-foreground text-base">
                  Your review helps us improve our services.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground">✓ You can now close this page</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-purple-500 mb-2">
                <Star className="h-6 w-6" />
                <span className="text-sm font-semibold uppercase tracking-wide">Review</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {reviewsData?.form.title}
              </h1>
              {reviewsData?.form.description && (
                <p className="text-lg text-muted-foreground">
                  {reviewsData.form.description}
                </p>
              )}
            </div>
            <ThemeToggle />
          </div>
          <div className="h-px bg-border"></div>
        </div>

        {/* Client Info Card */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">
                {reviewsData?.client.first_name?.charAt(0) || ''}{reviewsData?.client.last_name?.charAt(0) || ''}
              </span>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {reviewsData?.client.first_name || ''} {reviewsData?.client.last_name || ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {reviewsData?.client.email || ''}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Package className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-card-foreground">
              {reviewsData?.package.package_name || 'Package'}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="rounded-xl animate-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* All Form Fields */}
          <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Share Your Feedback</h2>
              <p className="text-sm text-muted-foreground">
                We value your opinion! Please take a moment to share your experience.
              </p>
            </div>
            <div className="h-px bg-border"></div>
            <div className="space-y-6">
              {reviewsData?.form.form_schema.fields.map((field) => renderField(field))}
            </div>
          </div>

        </form>
      </div>

      {/* Sticky Submit Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border shadow-2xl z-50">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block">
              All fields marked with <span className="text-destructive font-medium">*</span> are required
            </p>
            <Button 
              type="submit"
              onClick={handleSubmit}
              size="lg" 
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl py-6 px-8 text-lg font-semibold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Spacer for Sticky Bar */}
      <div className="h-24"></div>
    </div>
  );
}

