import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "stop" | "pause" | "package_change" | null;
}

export function StatusChangeDialog({ open, onOpenChange, type }: StatusChangeDialogProps) {
  const handleSubmit = (action: string) => {
    console.log(`Scheduling ${action}`);
    onOpenChange(false);
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
                <Input id="final-payment-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="final-coaching-date">When should their final coaching day be?</Label>
                <Input id="final-coaching-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stop-reason">Reason for stopping (optional)</Label>
                <Textarea id="stop-reason" placeholder="Enter reason..." rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={() => handleSubmit("client stop")}>Schedule Stop</Button>
              </div>
            </>
          )}

          {type === "pause" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pause-start-date">When should the pause start?</Label>
                <Input id="pause-start-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pause-end-date">When should the pause end?</Label>
                <Input id="pause-end-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pause-payment-handling">Payment handling during pause</Label>
                <Select>
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
                <Textarea id="pause-reason" placeholder="Enter reason..." rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={() => handleSubmit("client pause")}>Schedule Pause</Button>
              </div>
            </>
          )}

          {type === "package_change" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-package">New Package Type</Label>
                <Input id="new-package" placeholder="e.g., Premium Training" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-change-date">When should the package change take effect?</Label>
                <Input id="package-change-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-payment-amount">New Payment Amount</Label>
                <Input id="new-payment-amount" type="number" step="0.01" placeholder="299.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-payment-date">New Payment Date (day of month)</Label>
                <Input id="new-payment-date" type="number" min="1" max="31" placeholder="15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-change-reason">Reason for package change (optional)</Label>
                <Textarea id="package-change-reason" placeholder="Enter reason..." rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={() => handleSubmit("package change")}>Schedule Package Change</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
