import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { Payment, updatePayment } from "@/lib/api/payments";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PaymentDetailsDialogProps {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentUpdated: () => void;
}

export function PaymentDetailsDialog({ payment, open, onOpenChange, onPaymentUpdated }: PaymentDetailsDialogProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayment, setEditedPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEditPayment = () => {
    if (payment) {
      setEditedPayment({ ...payment });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditedPayment(null);
    setIsEditing(false);
  };

  const updateEditedField = (field: keyof Payment, value: any) => {
    if (editedPayment) {
      setEditedPayment({ ...editedPayment, [field]: value });
    }
  };

  const handleSavePayment = async () => {
    if (!editedPayment) return;
    setSaving(true);
    try {
      await updatePayment(Number(editedPayment.id), editedPayment);
      setIsEditing(false);
      onPaymentUpdated();
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'succeeded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'incomplete':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'disputed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return `${currency || 'USD'} ${Number(amount).toFixed(2)}`;
  };

  const displayPayment = isEditing ? editedPayment : payment;

  if (!displayPayment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Payment Details</DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={handleEditPayment} variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSavePayment} size="sm" disabled={saving}>
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
          {/* Payment Details Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
                Payment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Payment ID</Label>
                  <p className="font-mono text-sm font-medium mt-1">{displayPayment.id}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Amount</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={displayPayment.amount}
                      onChange={(e) => updateEditedField('amount', Number(e.target.value))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-lg font-bold mt-1">{formatCurrency(displayPayment.amount, displayPayment.paid_currency)}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  {isEditing ? (
                    <Input
                      value={displayPayment.paid_currency || ''}
                      onChange={(e) => updateEditedField('paid_currency', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{displayPayment.paid_currency || '-'}</p>
                  )}
                </div>

                {displayPayment.account_currency && displayPayment.account_currency !== displayPayment.paid_currency && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">Account Currency</Label>
                      <p className="font-medium mt-1">{displayPayment.account_currency}</p>
                    </div>
                    {displayPayment.exchange_rate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Exchange Rate</Label>
                        <p className="font-medium font-mono mt-1">{Number(displayPayment.exchange_rate).toFixed(6)}</p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  {isEditing ? (
                    <Select
                      value={displayPayment.status}
                      onValueChange={(value) => updateEditedField('status', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={`${getStatusColor(displayPayment.status)} mt-1`}>
                      {displayPayment.status.charAt(0).toUpperCase() + displayPayment.status.slice(1)}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Payment Date</Label>
                  <p className="font-medium mt-1">{formatDate(displayPayment.payment_date)}</p>
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
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Method</Label>
                  {isEditing ? (
                    <Input
                      value={displayPayment.payment_method || ''}
                      onChange={(e) => updateEditedField('payment_method', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{displayPayment.payment_method || '-'}</p>
                  )}
                </div>

                {displayPayment.native_account_currency && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Native Account Currency</Label>
                    <p className="font-medium mt-1">{displayPayment.native_account_currency}</p>
                  </div>
                )}

                {displayPayment.failure_reason && displayPayment.status === 'failed' && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                    <Label className="text-xs text-red-600 dark:text-red-400 font-semibold">Failure Reason</Label>
                    {isEditing ? (
                      <Input
                        value={displayPayment.failure_reason}
                        onChange={(e) => updateEditedField('failure_reason', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{displayPayment.failure_reason}</p>
                    )}
                  </div>
                )}
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
                {displayPayment.client_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Client Name</Label>
                    <p className="font-medium mt-1">{displayPayment.client_name}</p>
                  </div>
                )}

                {displayPayment.client_id && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Client ID</Label>
                    <p className="font-mono text-sm mt-1">{displayPayment.client_id}</p>
                  </div>
                )}

                {displayPayment.client_email && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium text-sm mt-1">{displayPayment.client_email}</p>
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
