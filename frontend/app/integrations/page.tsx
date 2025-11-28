"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainManagementIntegrated } from "@/components/integrations/DomainManagementIntegrated";
import { AppIntegrations } from "@/components/integrations/AppIntegrations";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function IntegrationsContent() {
  const [activeTab, setActiveTab] = useState("app-integrations");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { canViewIntegrations, canManageIntegrations, isSuperAdmin, isLoading } = usePermissions();

  useEffect(() => {
    // Check if returning from Stripe OAuth
    const stripeConnected = searchParams.get('stripe_connected');
    const accountName = searchParams.get('account_name');
    const error = searchParams.get('error');
    
    if (stripeConnected === 'true' && accountName) {
      // If this is a popup window, send message to parent and close
      if (window.opener) {
        window.opener.postMessage({
          type: 'STRIPE_OAUTH_SUCCESS',
          accountName: decodeURIComponent(accountName)
        }, window.location.origin);
        window.close();
      } else {
        // If not a popup, show toast in current window
        setActiveTab('app-integrations');
        
        toast({
          title: 'Stripe Connected Successfully',
          description: `Your Stripe account "${decodeURIComponent(accountName)}" has been connected.`,
          variant: 'default',
        });
        
        // Clean up URL parameters
        window.history.replaceState({}, '', '/integrations');
      }
    } else if (error) {
      // If this is a popup window, send error message to parent and close
      if (window.opener) {
        window.opener.postMessage({
          type: 'STRIPE_OAUTH_ERROR',
          error: decodeURIComponent(error)
        }, window.location.origin);
        window.close();
      } else {
        // If not a popup, show toast in current window
        setActiveTab('app-integrations');
        
        toast({
          title: 'Stripe Connection Failed',
          description: decodeURIComponent(error),
          variant: 'destructive',
        });
        
        // Clean up URL parameters
        window.history.replaceState({}, '', '/integrations');
      }
    }
  }, [searchParams, toast]);

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user has permission to access integrations
  const hasAccess = isSuperAdmin() || canViewIntegrations() || canManageIntegrations();

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="border-destructive/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription className="text-base">
              You don't have permission to access the Integrations page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-sm text-muted-foreground mb-6">
              This page is restricted to Super Admins and Admins with Integrations management permission.
              Please contact your administrator if you need access.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="default">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground text-lg">
          Manage your app connections and custom domains
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="app-integrations">App Integrations</TabsTrigger>
          <TabsTrigger value="custom-domain">Custom Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="app-integrations" className="space-y-6">
          <AppIntegrations />
        </TabsContent>

        <TabsContent value="custom-domain" className="space-y-6">
          <DomainManagementIntegrated />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <IntegrationsContent />
        </Suspense>
      </AppLayout>
    </AuthGuard>
  );
}
