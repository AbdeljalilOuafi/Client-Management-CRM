"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import ConnectStripeButton from "./ConnectStripeButton";
import { StripeAccountsManager } from "./StripeAccountsManager";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

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

export function AppIntegrations() {
  const { isSuperAdmin, canManageIntegrations } = usePermissions();
  const [stripeAccounts, setStripeAccounts] = useState<StripeAccount[]>([]);
  const [isLoadingStripe, setIsLoadingStripe] = useState(true);
  const [showStripeManager, setShowStripeManager] = useState(false);

  const integrations = [
    {
      name: "Slack",
      description: "Team notifications and updates",
      icon: "💬",
      comingSoon: true,
      isStripe: false,
    },
    {
      name: "Calendly",
      description: "Schedule appointments and consultations",
      icon: "📅",
      comingSoon: true,
      isStripe: false,
    },
  ];

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  };

  const fetchStripeAccounts = async () => {
    setIsLoadingStripe(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/stripe/accounts/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[AppIntegrations] Raw API response:', data);
        // Handle both paginated response (with results array) and direct array
        const accounts = Array.isArray(data) ? data : (data.results || []);
        console.log('[AppIntegrations] Parsed accounts:', accounts);
        console.log('[AppIntegrations] Accounts length:', accounts.length);
        setStripeAccounts(accounts);
      }
    } catch (error) {
      console.error('Failed to fetch Stripe accounts:', error);
    } finally {
      setIsLoadingStripe(false);
    }
  };

  useEffect(() => {
    fetchStripeAccounts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stripe Integration Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#635BFF]/10">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#635BFF">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
              </svg>
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Stripe</CardTitle>
              <CardDescription className="text-base">
                Payment processing and invoicing
              </CardDescription>
            </div>
            {stripeAccounts.length > 0 && (
              <Badge variant="default" className="text-sm">
                {stripeAccounts.length} {stripeAccounts.length === 1 ? 'Account' : 'Accounts'} Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingStripe ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : stripeAccounts.length > 0 ? (
            <>
              {/* Connected Accounts Summary */}
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <AlertDescription>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    ✓ Stripe Connected
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {stripeAccounts.length} Stripe {stripeAccounts.length === 1 ? 'account' : 'accounts'} connected. 
                    {stripeAccounts.find(acc => acc.is_primary) && (
                      <span className="font-medium">
                        {' '}Primary: {stripeAccounts.find(acc => acc.is_primary)?.stripe_account}
                      </span>
                    )}
                  </p>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowStripeManager(!showStripeManager)}
                  variant="outline"
                  className="flex-1"
                >
                  {showStripeManager ? 'Hide' : 'Manage'} Stripe Accounts
                </Button>
                <ConnectStripeButton onSuccess={fetchStripeAccounts} />
              </div>

              {/* Stripe Accounts Manager */}
              {showStripeManager && (
                <>
                  <Separator />
                  <StripeAccountsManager 
                    accounts={stripeAccounts}
                    onUpdate={fetchStripeAccounts}
                  />
                </>
              )}
            </>
          ) : (
            <>
              {/* No Accounts Connected */}
              <Alert>
                <AlertDescription>
                  <p className="font-semibold">No Stripe account connected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect your Stripe account to start processing payments
                  </p>
                </AlertDescription>
              </Alert>
              <ConnectStripeButton onSuccess={fetchStripeAccounts} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Other Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Other Integrations</CardTitle>
          <CardDescription>
            Connect your favorite tools and automate your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.name} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{integration.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                    {integration.comingSoon && (
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled={integration.comingSoon}
                  >
                    {integration.comingSoon ? "Coming Soon" : "Connect"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              More integrations coming soon! Have a suggestion? Let us know
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
