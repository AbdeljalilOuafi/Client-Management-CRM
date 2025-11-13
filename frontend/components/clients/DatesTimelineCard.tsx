import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/lib/api/clients";

interface DatesTimelineCardProps {
  client: Client;
}

export function DatesTimelineCard({ client }: DatesTimelineCardProps) {
  return (
    <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          Dates & Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-6 p-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
          <p className="font-semibold text-green-600 dark:text-green-400 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">{client.start_date || client.client_start_date || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
          <p className="font-semibold text-red-600 dark:text-red-400 py-2 px-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800">{client.end_date || client.client_end_date || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Next Payment Date</Label>
          <p className="font-semibold text-blue-600 dark:text-blue-400 py-2 px-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">{client.next_payment_date || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Latest Payment Date</Label>
          <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.latest_payment_date || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Number of Months</Label>
          <p className="font-mono font-bold text-lg text-primary py-2 px-3 bg-primary/10 rounded-md border border-primary/30">{client.no_months || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Number of Months Paid</Label>
          <p className="font-mono font-bold text-lg text-green-600 dark:text-green-400 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">{client.number_months_paid || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Minimum Term</Label>
          <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{client.minimum_term ? `${client.minimum_term} months` : "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Wedding Date</Label>
          <p className="font-semibold text-pink-600 dark:text-pink-400 py-2 px-3 bg-pink-50 dark:bg-pink-950/30 rounded-md border border-pink-200 dark:border-pink-800">{client.wedding_date || "-"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
