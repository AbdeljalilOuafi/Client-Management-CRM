"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { 
  Star, 
  Calendar,
  DollarSign,
  Loader2
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface StripeAccount {
  id: number;
  stripe_account: string;
  stripe_client_id: string | null;
  api_key: string;
  default_currency: string | null;
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
  const { isSuperAdmin } = usePermissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  };

  const getCurrencyInfo = (currency: string | null) => {
    if (!currency) {
      return {
        value: "usd",
        label: "USD - US Dollar",
        flag: "🇺🇸"
      };
    }
    return CURRENCY_OPTIONS.find(c => c.value === currency.toLowerCase()) || {
      value: currency,
      label: currency.toUpperCase(),
      flag: "💱"
    };
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

    </div>
  );
}
