"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConnectStripeButton from "./ConnectStripeButton";

export function AppIntegrations() {
  const integrations = [
    {
      name: "Stripe",
      description: "Payment processing and invoicing",
      icon: "💳",
      comingSoon: false,
      isStripe: true,
    },
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Integrations</CardTitle>
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
                {integration.isStripe ? (
                  <ConnectStripeButton />
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    disabled={integration.comingSoon}
                  >
                    {integration.comingSoon ? "Coming Soon" : "Connect"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            More integrations coming soon! Have a suggestion?{" "}
            <a href="mailto:support@fithq.com" className="text-primary hover:underline">
              Let us know
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
