import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "stop" | "pause" | "package_change" | null;
  clientId?: number;
}

export function StatusChangeDialog({ open, onOpenChange, type, clientId }: StatusChangeDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state for Stop Client
  const [finalPaymentDate, setFinalPaymentDate] = useState("");
  const [finalCoachingDate, setFinalCoachingDate] = useState("");
  const [stopReason, setStopReason] = useState("");
  
  // Form state for Pause Client
  const [pauseStartDate, setPauseStartDate] = useState("");
  const [pauseEndDate, setPauseEndDate] = useState("");
  const [pausePaymentHandling, setPausePaymentHandling] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  
  // Form state for Package Change
  const [newPackage, setNewPackage] = useState("");
  const [packageChangeDate, setPackageChangeDate] = useState("");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentDate, setNewPaymentDate] = useState("");
  const [packageChangeReason, setPackageChangeReason] = useState("");

  const resetForm = () => {
    setFinalPaymentDate("");
    setFinalCoachingDate("");
    setStopReason("");
    setPauseStartDate("");
    setPauseEndDate("");
    setPausePaymentHandling("");
    setPauseReason("");
    setNewPackage("");
    setPackageChangeDate("");
    setNewPaymentAmount("");
    setNewPaymentDate("");
    setPackageChangeReason("");
  };

  const handleSubmit = async (action: string) => {
    setLoading(true);
    
    try {
      // Get user data from localStorage
      const userDataString = localStorage.getItem("user");
      let userId = null;
      let accountId = null;

      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          userId = userData.id;
          accountId = userData.account_id;
        } catch (parseError) {
          console.error("Error parsing user data from localStorage:", parseError);
        }
      }

      // Prepare payload based on action type
      let payload: any = {
        userId,
        accountId,
        clientId,
        actionType: action,
        timestamp: new Date().toISOString(),
      };

      if (type === "stop") {
        payload = {
          ...payload,
          finalPaymentDate,
          finalCoachingDate,
          reason: stopReason,
        };
      } else if (type === "pause") {
        payload = {
          ...payload,
          pauseStartDate,
          pauseEndDate,
          paymentHandling: pausePaymentHandling,
          reason: pauseReason,
        };
      } else if (type === "package_change") {
        payload = {
          ...payload,
          newPackage,
          changeDate: packageChangeDate,
          newPaymentAmount: parseFloat(newPaymentAmount) || 0,
          newPaymentDate: parseInt(newPaymentDate) || 1,
          reason: packageChangeReason,
        };
      }

      // Get webhook URL from environment variable
      const webhookUrl = process.env.NEXT_PUBLIC_STATUS_CHANGE_WEBHOOK_URL;

      if (!webhookUrl) {
        throw new Error("Status change webhook URL not configured");
      }

      console.log("Status Change Payload:", payload);

      // Send to webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      toast({
        title: "Success!",
        description: `${action} has been scheduled successfully.`,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting status change:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule status change. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === "stop" && "Stop Client"}
            {type === "pause" && "Pause Client"}
            {type === "package_change" && "Package Change"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {type === "stop" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="final-payment-date">When should the final payment be?</Label>
                <Input 
                  id="final-payment-date" 
                  type="date" 
                  value={finalPaymentDate}
                  onChange={(e) => setFinalPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="final-coaching-date">When should their final coaching day be?</Label>
                <Input 
                  id="final-coaching-date" 
                  type="date" 
                  value={finalCoachingDate}
                  onChange={(e) => setFinalCoachingDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stop-reason">Reason for stopping (optional)</Label>
                <Textarea 
                  id="stop-reason" 
                  placeholder="Enter reason..." 
                  rows={3}
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={loading}>Cancel</Button>
                <Button onClick={() => handleSubmit("client stop")} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Stop
                </Button>
              </div>
            </>
          )}

          {type === "pause" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pause-start-date">When should the pause start?</Label>
                <Input 
                  id="pause-start-date" 
                  type="date"
                  value={pauseStartDate}
                  onChange={(e) => setPauseStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pause-end-date">When should the pause end?</Label>
                <Input 
                  id="pause-end-date" 
                  type="date"
                  value={pauseEndDate}
                  onChange={(e) => setPauseEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pause-payment-handling">Payment handling during pause</Label>
                <Select value={pausePaymentHandling} onValueChange={setPausePaymentHandling}>
                  <SelectTrigger id="pause-payment-handling" className="bg-background">
                    <SelectValue placeholder="Select option..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="skip">Skip payments during pause</SelectItem>
                    <SelectItem value="extend">Extend contract by pause duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pause-reason">Reason for pause (optional)</Label>
                <Textarea 
                  id="pause-reason" 
                  placeholder="Enter reason..." 
                  rows={3}
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={loading}>Cancel</Button>
                <Button onClick={() => handleSubmit("client pause")} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Pause
                </Button>
              </div>
            </>
          )}

          {type === "package_change" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-package">New Package Type</Label>
                <Input 
                  id="new-package" 
                  placeholder="e.g., Premium Training"
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-change-date">When should the package change take effect?</Label>
                <Input 
                  id="package-change-date" 
                  type="date"
                  value={packageChangeDate}
                  onChange={(e) => setPackageChangeDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-payment-amount">New Payment Amount</Label>
                <Input 
                  id="new-payment-amount" 
                  type="number" 
                  step="0.01" 
                  placeholder="299.00"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-payment-date">New Payment Date (day of month)</Label>
                <Input 
                  id="new-payment-date" 
                  type="number" 
                  min="1" 
                  max="31" 
                  placeholder="15"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-change-reason">Reason for package change (optional)</Label>
                <Textarea 
                  id="package-change-reason" 
                  placeholder="Enter reason..." 
                  rows={3}
                  value={packageChangeReason}
                  onChange={(e) => setPackageChangeReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={loading}>Cancel</Button>
                <Button onClick={() => handleSubmit("package change")} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Schedule Package Change
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
