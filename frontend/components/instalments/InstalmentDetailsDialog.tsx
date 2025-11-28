import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { Instalment, updateInstalment } from "@/lib/api/instalments";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface InstalmentDetailsDialogProps {
  instalment: Instalment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalmentUpdated: () => void;
}

export function InstalmentDetailsDialog({ instalment, open, onOpenChange, onInstalmentUpdated }: InstalmentDetailsDialogProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedInstalment, setEditedInstalment] = useState<Instalment | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEditInstalment = () => {
    if (instalment) {
      setEditedInstalment({ ...instalment });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedInstalment(null);
    setIsEditing(false);
  };

  const updateEditedField = (field: keyof Instalment, value: any) => {
    if (editedInstalment) {
      setEditedInstalment({ ...editedInstalment, [field]: value });
    }
  };

  const handleSaveInstalment = async () => {
    if (!editedInstalment) return;
    setSaving(true);
    try {
      await updateInstalment(Number(editedInstalment.id), editedInstalment);
      setIsEditing(false);
      onInstalmentUpdated();
      toast({
        title: "Success",
        description: "Instalment updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update instalment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: string, currency?: string) => {
    return `${currency || 'USD'} ${Number(amount).toFixed(2)}`;
  };

  const displayInstalment = isEditing ? editedInstalment : instalment;

  if (!displayInstalment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Instalment Details</DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={handleEditInstalment} variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveInstalment} size="sm" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Instalment Details Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Instalment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Schedule Date</Label>
                  <p className="font-medium mt-1">{formatDate(displayInstalment.schedule_date)}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={displayInstalment.amount}
                      onChange={(e) => updateEditedField('amount', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-lg font-bold mt-1">{formatCurrency(displayInstalment.amount, displayInstalment.currency)}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  {isEditing ? (
                    <Input
                      value={displayInstalment.currency || ''}
                      onChange={(e) => updateEditedField('currency', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{displayInstalment.currency || '-'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  {isEditing ? (
                    <Select
                      value={displayInstalment.status}
                      onValueChange={(value) => updateEditedField('status', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${getStatusColor(displayInstalment.status)} mt-1`}>
                      {displayInstalment.status.charAt(0).toUpperCase() + displayInstalment.status.slice(1)}
                    </Badge>
                  )}
                </div>

                {displayInstalment.instalment_number && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Instalment Number</Label>
                    <p className="font-medium mt-1">#{displayInstalment.instalment_number}</p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Date Created</Label>
                  <p className="font-medium mt-1">{formatDate(displayInstalment.date_created)}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Date Updated</Label>
                  <p className="font-medium mt-1">{formatDate(displayInstalment.date_updated)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Account Info
              </h3>
              <div className="space-y-4">
                {displayInstalment.stripe_account && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Stripe Account</Label>
                    <p className="font-medium text-sm mt-1">{displayInstalment.stripe_account}</p>
                  </div>
                )}

                {displayInstalment.stripe_customer_id && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Stripe Customer ID</Label>
                    <p className="font-mono text-xs mt-1 break-all">{displayInstalment.stripe_customer_id}</p>
                  </div>
                )}

                {displayInstalment.invoice_id && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice ID</Label>
                    <p className="font-mono text-xs mt-1 break-all">{displayInstalment.invoice_id}</p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Account Name</Label>
                  <p className="font-medium mt-1">{displayInstalment.account_name || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Info Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Client Info
              </h3>
              <div className="space-y-4">
                {displayInstalment.client_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Client Name</Label>
                    <p className="font-medium mt-1">{displayInstalment.client_name}</p>
                  </div>
                )}

                {displayInstalment.client && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Client ID</Label>
                    <p className="font-mono text-sm mt-1">{displayInstalment.client}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
