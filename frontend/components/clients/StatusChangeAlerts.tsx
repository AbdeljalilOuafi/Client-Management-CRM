import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AlertTriangle, Calendar, Edit, Trash2, XCircle, PauseCircle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduledChange {
  id: number;
  type: "stop" | "pause" | "package_change";
  scheduledDate: string;
  details: {
    finalPaymentDate?: string;
    finalCoachingDate?: string;
    pauseStartDate?: string;
    pauseEndDate?: string;
    paymentHandling?: string;
    newPackage?: string;
    changeDate?: string;
    newPaymentAmount?: number;
    newPaymentDate?: number;
    reason?: string;
  };
  createdAt: string;
}

interface StatusChangeAlertsProps {
  clientId: number;
  onEdit: (change: ScheduledChange) => void;
}

export function StatusChangeAlerts({ clientId, onEdit }: StatusChangeAlertsProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<ScheduledChange | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Mock data - will be replaced with API call
  const [scheduledChanges, setScheduledChanges] = useState<ScheduledChange[]>([
    {
      id: 1,
      type: "stop",
      scheduledDate: "2025-12-31",
      details: {
        finalPaymentDate: "2025-12-31",
        finalCoachingDate: "2025-12-31",
        reason: "Client requested to stop",
      },
      createdAt: "2025-11-18T08:00:00Z",
    },
    {
      id: 2,
      type: "pause",
      scheduledDate: "2025-12-01",
      details: {
        pauseStartDate: "2025-12-01",
        pauseEndDate: "2026-01-15",
        paymentHandling: "skip",
        reason: "Medical leave",
      },
      createdAt: "2025-11-17T10:00:00Z",
    },
  ]);

  const handleDeleteClick = (change: ScheduledChange) => {
    setSelectedChange(change);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedChange) return;

    try {
      // TODO: API call to delete scheduled change
      // await deleteScheduledChange(selectedChange.id);

      setScheduledChanges(scheduledChanges.filter((c) => c.id !== selectedChange.id));

      toast({
        title: "Scheduled change deleted",
        description: "The scheduled status change has been removed.",
      });

      setDeleteDialogOpen(false);
      setSelectedChange(null);
      setDeleteConfirmText("");
    } catch (error) {
      console.error("Error deleting scheduled change:", error);
      toast({
        title: "Error",
        description: "Failed to delete scheduled change. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getChangeTypeName = () => {
    if (!selectedChange) return "";
    switch (selectedChange.type) {
      case "stop":
        return "client stop";
      case "pause":
        return "client pause";
      case "package_change":
        return "package change";
      default:
        return "scheduled change";
    }
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case "stop":
        return {
          icon: XCircle,
          color: "border-red-500 bg-red-50 dark:bg-red-950/30",
          iconColor: "text-red-600 dark:text-red-400",
          title: "Client Stop Scheduled",
        };
      case "pause":
        return {
          icon: PauseCircle,
          color: "border-orange-500 bg-orange-50 dark:bg-orange-950/30",
          iconColor: "text-orange-600 dark:text-orange-400",
          title: "Client Pause Scheduled",
        };
      case "package_change":
        return {
          icon: Package,
          color: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          title: "Package Change Scheduled",
        };
      default:
        return {
          icon: AlertTriangle,
          color: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          title: "Status Change Scheduled",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderDetails = (change: ScheduledChange) => {
    const { type, details } = change;

    if (type === "stop") {
      return (
        <div className="space-y-1 text-sm">
          {details.finalPaymentDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Final Payment:</span>
              <span>{formatDate(details.finalPaymentDate)}</span>
            </div>
          )}
          {details.finalCoachingDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Final Coaching:</span>
              <span>{formatDate(details.finalCoachingDate)}</span>
            </div>
          )}
          {details.reason && (
            <div className="mt-2">
              <span className="font-medium">Reason:</span> {details.reason}
            </div>
          )}
        </div>
      );
    }

    if (type === "pause") {
      return (
        <div className="space-y-1 text-sm">
          {details.pauseStartDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Pause Start:</span>
              <span>{formatDate(details.pauseStartDate)}</span>
            </div>
          )}
          {details.pauseEndDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Pause End:</span>
              <span>{formatDate(details.pauseEndDate)}</span>
            </div>
          )}
          {details.paymentHandling && (
            <div className="mt-2">
              <span className="font-medium">Payment Handling:</span>{" "}
              {details.paymentHandling === "skip" ? "Skip payments during pause" : "Extend contract by pause duration"}
            </div>
          )}
          {details.reason && (
            <div className="mt-2">
              <span className="font-medium">Reason:</span> {details.reason}
            </div>
          )}
        </div>
      );
    }

    if (type === "package_change") {
      return (
        <div className="space-y-1 text-sm">
          {details.newPackage && (
            <div>
              <span className="font-medium">New Package:</span> {details.newPackage}
            </div>
          )}
          {details.changeDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-medium">Effective Date:</span>
              <span>{formatDate(details.changeDate)}</span>
            </div>
          )}
          {details.newPaymentAmount && (
            <div>
              <span className="font-medium">New Payment Amount:</span> ${details.newPaymentAmount.toFixed(2)}
            </div>
          )}
          {details.newPaymentDate && (
            <div>
              <span className="font-medium">New Payment Date:</span> Day {details.newPaymentDate} of month
            </div>
          )}
          {details.reason && (
            <div className="mt-2">
              <span className="font-medium">Reason:</span> {details.reason}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  if (scheduledChanges.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {scheduledChanges.map((change) => {
          const config = getAlertConfig(change.type);
          const Icon = config.icon;

          return (
            <Alert key={change.id} className={`${config.color} border-2 shadow-lg`}>
              <div className="flex items-start gap-4">
                <Icon className={`h-5 w-5 mt-0.5 ${config.iconColor}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-bold text-base ${config.iconColor}`}>{config.title}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(change)}
                        className="h-8 px-3"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(change)}
                        className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  <AlertDescription className="text-foreground">
                    {renderDetails(change)}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground pt-2">
              Are you sure you want to delete this {getChangeTypeName()}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-4">
            <Label htmlFor="delete-confirm" className="text-base font-semibold">
              Type "delete" to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="text-base h-12 border-2"
              autoComplete="off"
            />
          </div>

          <AlertDialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText("");
              }}
              className="text-base h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText.toLowerCase() !== "delete"}
              className="bg-red-600 hover:bg-red-700 text-white text-base h-11 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete {selectedChange?.type === "stop" ? "Stop" : selectedChange?.type === "pause" ? "Pause" : "Change"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
