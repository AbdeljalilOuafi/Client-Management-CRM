import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Calendar, DollarSign, Clock, Plus } from "lucide-react";
import { Client } from "@/lib/api/clients";
import { ClientDetailsResponse } from "@/lib/api/client-details";
import { PackageHistory } from "./PackageHistory";
import { AddPackageDialog } from "./AddPackageDialog";

interface PackageInfoCardProps {
  client: Client;
  detailedData?: ClientDetailsResponse | null;
}

export function PackageInfoCard({ client, detailedData }: PackageInfoCardProps) {
  // Use detailed data if available, otherwise fall back to client data
  const packageInfo = detailedData?.package_info;
  const paymentInfo = detailedData?.payment_info;
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false);
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);

  // Calculate package length in days
  const calculatePackageLength = () => {
    if (packageInfo?.start_date && packageInfo?.end_date) {
      const start = new Date(packageInfo.start_date);
      const end = new Date(packageInfo.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    }
    return "-";
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Calculate payment breakdown
  const totalPackageValue = paymentInfo?.payment_amount || 0;
  const paidSoFar = paymentInfo?.ltv || 0;
  const leftToPay = Math.max(0, totalPackageValue - paidSoFar);

  // Check if it's a subscription (no end date)
  const isSubscription = packageInfo?.payment_schedule?.toLowerCase().includes('subscription') || 
                         packageInfo?.payment_schedule?.toLowerCase().includes('monthly') ||
                         packageInfo?.payment_schedule?.toLowerCase().includes('weekly');

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            Package & Payment Information
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsAddPackageOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add New Package
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="hover:bg-muted"
            >
              {isHistoryOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide All Packages
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  View All Packages
                </>
              )}
            </Button>
          </div>
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
        <div className="space-y-6">
          {/* Status and Package Type */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Package Status</Label>
              <div className="py-1">
                <Badge 
                  variant={getStatusVariant(packageInfo?.status || client.status)}
                  className="text-sm px-3 py-1.5 font-semibold"
                >
                  {(packageInfo?.status || client.status || 'pending').charAt(0).toUpperCase() + (packageInfo?.status || client.status || 'pending').slice(1)}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Package Type</Label>
              <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{packageInfo?.package_type || client.package_type || "-"}</p>
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payment Schedule
            </Label>
            <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
              <p className="font-semibold text-foreground">
                {packageInfo?.payment_schedule || client.payment_plan || "-"}
              </p>
              {(packageInfo?.payment_schedule?.toLowerCase().includes('subscription') || 
                packageInfo?.payment_schedule?.toLowerCase().includes('monthly') ||
                packageInfo?.payment_schedule?.toLowerCase().includes('weekly')) && (
                <p className="text-sm text-muted-foreground mt-1">
                  Payment day: {paymentInfo?.day_of_month || client.day_of_month_payment || "-"}
                </p>
              )}
            </div>
          </div>

          {/* Start/Expiry/Length */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Start Date
              </Label>
              <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md text-sm">
                {packageInfo?.start_date ? new Date(packageInfo.start_date).toLocaleDateString() : "-"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expiry Date
              </Label>
              <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md text-sm">
                {packageInfo?.end_date ? new Date(packageInfo.end_date).toLocaleDateString() : isSubscription ? "Ongoing" : "-"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Package Length</Label>
              <p className="font-semibold text-primary py-2 px-3 bg-primary/10 rounded-md text-sm">
                {isSubscription ? "Ongoing" : calculatePackageLength()}
              </p>
            </div>
          </div>

          {/* Package Amount Breakdown */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Package Value
              </Label>
              <p className="font-bold text-2xl text-green-600 dark:text-green-400">
                ${isSubscription ? paidSoFar.toFixed(2) : totalPackageValue.toFixed(2)}
              </p>
            </div>
            {!isSubscription && (
              <>
                <div className="flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800">
                  <span className="text-sm text-muted-foreground">Paid so far</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${paidSoFar.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Left to pay</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    ${leftToPay.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {isSubscription && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-green-200 dark:border-green-800">
                Total reflects sum of all payments (ongoing subscription)
              </p>
            )}
          </div>

          {/* Installments Section */}
          {packageInfo?.payment_schedule?.toLowerCase().includes('installment') && (
            <Collapsible open={isInstallmentsOpen} onOpenChange={setIsInstallmentsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    View Scheduled Installments
                  </span>
                  {isInstallmentsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="p-4 bg-muted/30 rounded-md border">
                  <p className="text-sm text-muted-foreground">
                    Installment details will be loaded from the backend
                  </p>
                  {/* TODO: Fetch and display installments from API */}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
            <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">{paymentInfo?.currency || client.native_currency || client.currency || "-"}</p>
          </div>
        </div>
      </CardContent>

      {/* Add Package Dialog */}
      <AddPackageDialog
        open={isAddPackageOpen}
        onOpenChange={setIsAddPackageOpen}
        clientId={client.id}
        onSuccess={() => {
          // Refresh client data
          window.location.reload();
        }}
      />
    </Card>
  );
}
