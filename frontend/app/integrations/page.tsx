"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainManagementIntegrated } from "@/components/integrations/DomainManagementIntegrated";
import { AppIntegrations } from "@/components/integrations/AppIntegrations";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState("custom-domain");

  return (
    <AuthGuard>
      <AppLayout>
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
      </AppLayout>
    </AuthGuard>
  );
}
