import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/lib/api/clients";

interface TeamSupportCardProps {
  client: Client;
}

export function TeamSupportCard({ client }: TeamSupportCardProps) {
  return (
    <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-purple-500"></div>
          Team & Support
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6 p-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Coach</Label>
          <p className="font-semibold text-purple-600 dark:text-purple-400 py-2 px-3 bg-purple-50 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-800">{client.coach_name || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Closer</Label>
          <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.closer || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Setter</Label>
          <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.setter || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Monthly Calls</Label>
          <p className="font-mono font-bold text-lg text-primary py-2 px-3 bg-primary/10 rounded-md border border-primary/30">{client.monthly_calls || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">CTA/Lead Origin</Label>
          <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.cta_lead_origin || client.lead_origin || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Notice Given</Label>
          <p className={`font-semibold py-2 px-3 rounded-md ${client.notice_given ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800' : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'}`}>{client.notice_given ? "Yes" : "No"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
