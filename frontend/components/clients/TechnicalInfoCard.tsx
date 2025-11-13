import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/lib/api/clients";

interface TechnicalInfoCardProps {
  client: Client;
}

export function TechnicalInfoCard({ client }: TechnicalInfoCardProps) {
  return (
    <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
          Technical Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6 p-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">GHL ID</Label>
          <p className="font-mono font-semibold text-sm text-foreground py-2 px-3 bg-muted/50 rounded-md border border-muted break-all">{client.ghl_id || "-"}</p>
        </div>
        {client.stripe_customer_id && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Stripe Customer ID</Label>
            <p className="font-mono font-semibold text-sm text-purple-600 dark:text-purple-400 py-2 px-3 bg-purple-50 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-800 break-all">{client.stripe_customer_id}</p>
          </div>
        )}
        {client.mamo_pay_id && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Mamo Pay ID</Label>
            <p className="font-mono font-semibold text-sm text-blue-600 dark:text-blue-400 py-2 px-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800 break-all">{client.mamo_pay_id}</p>
          </div>
        )}
        {client.coaching_app_id && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Coaching App ID</Label>
            <p className="font-mono font-semibold text-sm text-green-600 dark:text-green-400 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800 break-all">{client.coaching_app_id}</p>
          </div>
        )}
        {client.trz_id && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">TRZ ID</Label>
            <p className="font-mono font-semibold text-sm text-orange-600 dark:text-orange-400 py-2 px-3 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-200 dark:border-orange-800 break-all">{client.trz_id}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
