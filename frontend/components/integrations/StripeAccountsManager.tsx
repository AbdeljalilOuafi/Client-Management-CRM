"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { 
  Star, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface StripeAccount {
  id: number;
  stripe_account: string;
  stripe_client_id: string;
  api_key: string;
  default_currency: string;
  is_primary: boolean;
  account: number;
  created_at: string;
}

interface StripeAccountsManagerProps {
  accounts: StripeAccount[];
  onUpdate: () => void;
}

const CURRENCY_OPTIONS = [
  { value: "usd", label: "USD - US Dollar", flag: "🇺🇸" },
  { value: "eur", label: "EUR - Euro", flag: "🇪🇺" },
  { value: "gbp", label: "GBP - British Pound", flag: "🇬🇧" },
  { value: "cad", label: "CAD - Canadian Dollar", flag: "🇨🇦" },
  { value: "aud", label: "AUD - Australian Dollar", flag: "🇦🇺" },
  { value: "jpy", label: "JPY - Japanese Yen", flag: "🇯🇵" },
  { value: "chf", label: "CHF - Swiss Franc", flag: "🇨🇭" },
  { value: "aed", label: "AED - UAE Dirham", flag: "🇦🇪" },
];

export function StripeAccountsManager({ accounts, onUpdate }: StripeAccountsManagerProps) {
  const { isSuperAdmin, canManageIntegrations } = usePermissions();
  const [editingAccount, setEditingAccount] = useState<StripeAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<StripeAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    stripe_account: "",
    default_currency: "",
  });

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  };

  const getCurrencyInfo = (currency: string) => {
    return CURRENCY_OPTIONS.find(c => c.value === currency.toLowerCase()) || {
      value: currency,
      label: currency.toUpperCase(),
      flag: "💱"
    };
  };

  const handleEditClick = (account: StripeAccount) => {
    setEditingAccount(account);
    setEditForm({
      stripe_account: account.stripe_account,
      default_currency: account.default_currency,
    });
  };

  const handleEditSubmit = async () => {
    if (!editingAccount) return;

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/stripe/accounts/${editingAccount.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update account');
      }

      toast.success('Stripe account updated successfully');
      setEditingAccount(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrimary = async (accountId: number) => {
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/stripe/accounts/${accountId}/set_primary/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to set primary account');
      }

      toast.success('Primary account updated successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to set primary account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/stripe/accounts/${deletingAccount.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete account');
      }

      toast.success('Stripe account removed successfully');
      setDeletingAccount(null);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = isSuperAdmin() || canManageIntegrations();
  const canDelete = isSuperAdmin();
  const canSetPrimary = isSuperAdmin();

  const primaryAccountId = accounts.find(acc => acc.is_primary)?.id?.toString() || accounts[0]?.id?.toString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Connected Stripe Accounts</h3>
        <Badge variant="outline" className="text-xs">
          {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
        </Badge>
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => {
          const currencyInfo = getCurrencyInfo(account.default_currency);
          const isPrimary = account.is_primary;

          return (
            <Card key={account.id} className={isPrimary ? "border-2 border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Primary Radio Button */}
                    {canSetPrimary && (
                      <div className="flex items-center pt-1">
                        <RadioGroup
                          value={primaryAccountId}
                          onValueChange={(value) => handleSetPrimary(parseInt(value))}
                          disabled={isSubmitting}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={account.id.toString()} 
                              id={`primary-${account.id}`}
                              className="cursor-pointer"
                            />
                            <Label 
                              htmlFor={`primary-${account.id}`} 
                              className="text-xs text-muted-foreground cursor-pointer font-normal"
                            >
                              Primary
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                    
                    {/* Account Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{account.stripe_account}</CardTitle>
                        {isPrimary && (
                          <Badge variant="default" className="text-xs gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Primary
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-1 break-all">
                        {account.stripe_client_id}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(account)}
                        disabled={isSubmitting}
                        title="Edit account"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingAccount(account)}
                        disabled={isSubmitting || (isPrimary && accounts.length > 1) || accounts.length === 1}
                        title={
                          accounts.length === 1 
                            ? "Cannot delete last account" 
                            : isPrimary && accounts.length > 1 
                            ? "Cannot delete primary account" 
                            : "Delete account"
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Default Currency</p>
                      <p className="font-medium">
                        {currencyInfo.flag} {currencyInfo.label.split(' - ')[0]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Connected</p>
                      <p className="font-medium">
                        {new Date(account.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stripe Account</DialogTitle>
            <DialogDescription>
              Update the display name and default currency for this Stripe account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Display Name</Label>
              <Input
                id="account-name"
                value={editForm.stripe_account}
                onChange={(e) => setEditForm({ ...editForm, stripe_account: e.target.value })}
                placeholder="e.g., FitHQ Business Account"
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this Stripe account
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={editForm.default_currency}
                onValueChange={(value) => setEditForm({ ...editForm, default_currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.flag} {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The default currency for payments processed through this account
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingAccount(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Stripe Account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAccount?.is_primary && accounts.length > 1 ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-semibold">Cannot delete primary account</p>
                      <p className="text-sm mt-1">
                        Please set another account as primary before deleting this one.
                      </p>
                    </div>
                  </div>
                </div>
              ) : accounts.length === 1 ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-semibold">Cannot delete last account</p>
                      <p className="text-sm mt-1">
                        You must have at least one Stripe account configured.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  Are you sure you want to remove <strong>{deletingAccount?.stripe_account}</strong>? 
                  This action cannot be undone and will disconnect this Stripe account from your system.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            {!deletingAccount?.is_primary && accounts.length > 1 && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Removing...
                  </>
                ) : (
                  'Yes, Remove Account'
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
