import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from "@/lib/api/clients";
import { ClientDetailsResponse } from "@/lib/api/client-details";

interface DatesTimelineCardProps {
  client: Client;
  detailedData?: ClientDetailsResponse | null;
}

export function DatesTimelineCard({ client, detailedData }: DatesTimelineCardProps) {
  const packageInfo = detailedData?.package_info;
  const paymentInfo = detailedData?.payment_info;
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
          <p className="font-semibold text-green-600 dark:text-green-400 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">{packageInfo?.start_date || client.start_date || client.client_start_date || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
          <p className="font-semibold text-red-600 dark:text-red-400 py-2 px-3 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800">{packageInfo?.end_date || client.end_date || client.client_end_date || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Next Payment Date</Label>
          <p className="font-semibold text-blue-600 dark:text-blue-400 py-2 px-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">{paymentInfo?.next_payment_date ? new Date(paymentInfo.next_payment_date).toLocaleDateString() : client.next_payment_date || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Latest Payment Date</Label>
          <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{paymentInfo?.latest_payment_date ? new Date(paymentInfo.latest_payment_date).toLocaleDateString() : client.latest_payment_date || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Number of Months</Label>
          <p className="font-mono font-bold text-lg text-primary py-2 px-3 bg-primary/10 rounded-md border border-primary/30">{paymentInfo?.number_of_months || client.no_months || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Number of Months Paid</Label>
          <p className="font-mono font-bold text-lg text-green-600 dark:text-green-400 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">{paymentInfo?.number_of_months_paid || client.number_months_paid || "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Minimum Term</Label>
          <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{packageInfo?.minimum_term ? `${packageInfo.minimum_term} months` : client.minimum_term ? `${client.minimum_term} months` : "-"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Payments Left</Label>
          <p className="font-mono font-bold text-lg text-orange-600 dark:text-orange-400 py-2 px-3 bg-orange-50 dark:bg-orange-950/30 rounded-md border border-orange-200 dark:border-orange-800">{packageInfo?.payments_left || "-"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
