"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ValidationStatus = "not_set" | "validating" | "verified" | "failed";

interface DomainStatusIndicatorProps {
  status: ValidationStatus;
  lastChecked: Date | null;
  errorMessage?: string;
  validationAttempts: number;
  maxAttempts: number;
}

export function DomainStatusIndicator({
  status,
  lastChecked,
  errorMessage,
  validationAttempts,
  maxAttempts,
}: DomainStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "not_set":
        return {
          color: "text-red-600",
          bgColor: "bg-red-100",
          progressColor: "bg-red-600",
          icon: "🔴",
          label: "Not Set Up",
          description: "DNS record not detected",
          progress: 0,
        };
      case "validating":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          progressColor: "bg-yellow-600",
          icon: "🟡",
          label: "Checking...",
          description: "Validating DNS configuration",
          progress: (validationAttempts / maxAttempts) * 100,
        };
      case "verified":
        return {
          color: "text-green-600",
          bgColor: "bg-green-100",
          progressColor: "bg-green-600",
          icon: "🟢",
          label: "Verified",
          description: "Domain is ready to use",
          progress: 100,
        };
      case "failed":
        return {
          color: "text-red-600",
          bgColor: "bg-red-100",
          progressColor: "bg-red-600",
          icon: "🔴",
          label: "Validation Failed",
          description: errorMessage || "DNS record not found",
          progress: 0,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Domain Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className={`font-semibold ${config.color}`}>
                {config.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {config.description}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={config.progress} 
            className={`h-2 ${status === "validating" ? "animate-pulse" : ""}`}
          />
          {status === "validating" && (
            <p className="text-xs text-muted-foreground">
              Attempt {validationAttempts} of {maxAttempts}
            </p>
          )}
        </div>

        {/* Last Checked */}
        {lastChecked && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Last checked: {formatDistanceToNow(lastChecked, { addSuffix: true })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
