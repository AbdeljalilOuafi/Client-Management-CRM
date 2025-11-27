"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainManagementIntegrated } from "@/components/integrations/DomainManagementIntegrated";
import { AppIntegrations } from "@/components/integrations/AppIntegrations";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function IntegrationsContent() {
  const [activeTab, setActiveTab] = useState("custom-domain");
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Check if returning from Stripe OAuth
    const stripeConnected = searchParams.get('stripe_connected');
    const accountName = searchParams.get('account_name');
    const error = searchParams.get('error');
    
    if (stripeConnected === 'true' && accountName) {
      // Switch to app integrations tab to show success
      setActiveTab('app-integrations');
      
      toast({
        title: 'Stripe Connected Successfully',
        description: `Your Stripe account "${decodeURIComponent(accountName)}" has been connected.`,
        variant: 'default',
      });
      
      // Clean up URL parameters
      window.history.replaceState({}, '', '/integrations');
    } else if (error) {
      // Switch to app integrations tab to show error
      setActiveTab('app-integrations');
      
      toast({
        title: 'Stripe Connection Failed',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
      
      // Clean up URL parameters
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams, toast]);

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
          <TabsTrigger value="custom-domain">Custom Domains</TabsTrigger>
          <TabsTrigger value="app-integrations">App Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="custom-domain" className="space-y-6">
          <DomainManagementIntegrated />
        </TabsContent>

        <TabsContent value="app-integrations" className="space-y-6">
          <AppIntegrations />
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
