import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Client } from "@/lib/api/clients";
import { ClientDetailsResponse } from "@/lib/api/client-details";
import { PackageHistory } from "./PackageHistory";

interface PackageInfoCardProps {
  client: Client;
  detailedData?: ClientDetailsResponse | null;
}

export function PackageInfoCard({ client, detailedData }: PackageInfoCardProps) {
  // Use detailed data if available, otherwise fall back to client data
  const packageInfo = detailedData?.package_info;
  const paymentInfo = detailedData?.payment_info;
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            Package & Payment Information
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="hover:bg-muted"
          >
            {isHistoryOpen ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide History
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                View History
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Package History Section - Shown at top when open */}
        {isHistoryOpen && (
          <div className="mb-6">
            <PackageHistory clientId={client.id} isOpen={isHistoryOpen} />
          </div>
        )}

        {/* Current Package & Payment Data */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <div className="py-1">
              <Badge 
                variant={client.status === 'active' ? 'default' : 'secondary'}
                className="text-sm px-3 py-1.5 font-semibold"
              >
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Package Type</Label>
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{packageInfo?.package_type || client.package_type || "-"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{paymentInfo?.payment_method || client.payment_method || "-"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Payment Schedule</Label>
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{packageInfo?.payment_schedule || client.payment_plan || "-"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Payment Amount</Label>
            <p className="font-bold text-lg text-green-600 dark:text-green-400 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">${paymentInfo?.payment_amount?.toFixed(2) || client.payment_amount?.toFixed(2) || "0.00"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Latest Payment Amount</Label>
            <p className="font-bold text-lg text-blue-600 dark:text-blue-400 py-2 px-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">${paymentInfo?.latest_payment_amount?.toFixed(2) || client.latest_payment_amount?.toFixed(2) || "0.00"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">LTV (Lifetime Value)</Label>
            <p className="font-bold text-xl text-green-600 dark:text-green-400 py-2 px-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-md border-2 border-green-300 dark:border-green-700 shadow-sm">${paymentInfo?.ltv?.toFixed(2) || client.ltv?.toFixed(2) || "0.00"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{paymentInfo?.currency || client.native_currency || client.currency || "-"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Day of Month for Payment</Label>
            <p className="font-mono font-semibold text-primary py-2 px-3 bg-primary/5 rounded-md border border-primary/20">{paymentInfo?.day_of_month || client.day_of_month_payment || "-"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">No More Payments</Label>
            <p className={`font-semibold py-2 px-3 rounded-md ${(paymentInfo?.no_more_payments ?? client.no_more_payments) ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800' : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'}`}>{(paymentInfo?.no_more_payments ?? client.no_more_payments) ? "Yes" : "No"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
