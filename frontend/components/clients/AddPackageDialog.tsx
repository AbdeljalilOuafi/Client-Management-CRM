"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package as PackageIcon, FileText, Link as LinkIcon } from "lucide-react";
import { listPackages, type Package } from "@/lib/api/packages";
import { listClients, type Client } from "@/lib/api/clients";
import { createClientPackage } from "@/lib/api/client-packages";
import { useQuery } from "@tanstack/react-query";

interface AddPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: number; // Optional - only shown in PackageInfoCard, not on clients page
  onSuccess?: () => void;
}

const CURRENCY_OPTIONS = [
  { value: "usd", label: "USD - US Dollar", flag: "🇺🇸" },
  { value: "eur", label: "EUR - Euro", flag: "🇪🇺" },
  { value: "gbp", label: "GBP - British Pound", flag: "🇬🇧" },
  { value: "cad", label: "CAD - Canadian Dollar", flag: "🇨🇦" },
  { value: "aud", label: "AUD - Australian Dollar", flag: "🇦🇺" },
  { value: "aed", label: "AED - UAE Dirham", flag: "🇦🇪" },
];

const PAYMENT_SCHEDULE_OPTIONS = [
  { value: "paid_in_full", label: "Paid in Full" },
  { value: "installments", label: "Installments" },
  { value: "subscription_monthly", label: "Subscription - Monthly" },
  { value: "subscription_weekly", label: "Subscription - Weekly" },
];

export function AddPackageDialog({ open, onOpenChange, clientId, onSuccess }: AddPackageDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedClient, setSelectedClient] = useState<string>(clientId?.toString() || "");
  const [packageType, setPackageType] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [subscriptionPaymentDay, setSubscriptionPaymentDay] = useState("1");
  const [manualExpiryOverride, setManualExpiryOverride] = useState(false);

  // Fetch packages from backend
  const { data: packages, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ["packages"],
    queryFn: listPackages,
  });

  // Fetch clients from backend (only if clientId not provided)
  const { data: clientsData, isLoading: clientsLoading } = useQuery<{
    count: number;
    results: Client[];
  }>({
    queryKey: ["clients"],
    queryFn: async () => {
      const response = await listClients();
      return response;
    },
    enabled: !clientId, // Only fetch if we need the dropdown
  });

  const clients = clientsData?.results || [];

  // Auto-calculate expiry date based on package type
  useEffect(() => {
    if (!manualExpiryOverride && packageType && startDate) {
      const selectedPackage = packages?.find(pkg => pkg.id.toString() === packageType);
      if (selectedPackage?.package_name) {
        // Extract duration from package name (e.g., "6 Month Package" -> 6 months)
        const monthMatch = selectedPackage.package_name.match(/(\d+)\s*month/i);
        const weekMatch = selectedPackage.package_name.match(/(\d+)\s*week/i);
        
        if (monthMatch) {
          const months = parseInt(monthMatch[1]);
          const start = new Date(startDate);
          start.setMonth(start.getMonth() + months);
          setExpiryDate(start.toISOString().split('T')[0]);
        } else if (weekMatch) {
          const weeks = parseInt(weekMatch[1]);
          const start = new Date(startDate);
          start.setDate(start.getDate() + (weeks * 7));
          setExpiryDate(start.toISOString().split('T')[0]);
        }
      }
    }
  }, [packageType, startDate, packages, manualExpiryOverride]);

  // Clear expiry date for subscriptions
  useEffect(() => {
    if (paymentSchedule.includes('subscription')) {
      setExpiryDate("");
    }
  }, [paymentSchedule]);

  const resetForm = () => {
    if (!clientId) setSelectedClient("");
    setPackageType("");
    setStartDate(new Date().toISOString().split('T')[0]);
    setExpiryDate("");
    setPaymentSchedule("");
    setCurrency("usd");
    setSubscriptionPaymentDay("1");
    setManualExpiryOverride(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!clientId && !selectedClient) {
      toast({
        title: "Validation Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    if (!packageType || !startDate || !paymentSchedule || !currency) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!paymentSchedule.includes('subscription') && !expiryDate) {
      toast({
        title: "Validation Error",
        description: "Please provide an expiry date or select a subscription",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const status: "pending" | "active" | "inactive" = startDate > today ? 'pending' : 'active';

      // Payload matches backend API structure from PENDING_STATUS_AND_CLIENT_PACKAGE_API.md
      const payload = {
        client: clientId || parseInt(selectedClient),
        package: parseInt(packageType),
        status: status,
        start_date: startDate,
        end_date: paymentSchedule.includes('subscription') ? null : (expiryDate || null),
      };

      console.log("Add Package Payload:", payload);

      // Use the API function
      await createClientPackage(payload);

      toast({
        title: "Success!",
        description: `Package has been ${status === 'pending' ? 'scheduled' : 'added'} successfully.`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding package:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isSubscription = paymentSchedule.includes('subscription');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Add New Package
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Client Dropdown - Only show if not in PackageInfoCard */}
          {!clientId && (
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="client" className="bg-background">
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading clients...
                    </SelectItem>
                  ) : clients.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No clients found
                    </SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.first_name} {client.last_name} ({client.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Package Type */}
          <div className="space-y-2">
            <Label htmlFor="package-type">Package Type *</Label>
            <Select value={packageType} onValueChange={setPackageType}>
              <SelectTrigger id="package-type" className="bg-background">
                <SelectValue placeholder="Select package..." />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {packagesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading packages...
                  </SelectItem>
                ) : !packages || packages.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    No packages found
                  </SelectItem>
                ) : (
                  packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id.toString()}>
                      {pkg.package_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date *</Label>
            <Input 
              id="start-date" 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {startDate > new Date().toISOString().split('T')[0] && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ This package will be created with "pending" status
              </p>
            )}
          </div>

          {/* Payment Schedule */}
          <div className="space-y-2">
            <Label htmlFor="payment-schedule">Payment Schedule *</Label>
            <Select value={paymentSchedule} onValueChange={setPaymentSchedule}>
              <SelectTrigger id="payment-schedule" className="bg-background">
                <SelectValue placeholder="Select schedule..." />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {PAYMENT_SCHEDULE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Date - Hidden for subscriptions */}
          {!isSubscription && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="expiry-date">Expiry Date *</Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setManualExpiryOverride(!manualExpiryOverride)}
                >
                  {manualExpiryOverride ? "Auto-calculate" : "Manual override"}
                </button>
              </div>
              <Input 
                id="expiry-date" 
                type="date" 
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  setManualExpiryOverride(true);
                }}
              />
              {!manualExpiryOverride && expiryDate && (
                <p className="text-xs text-muted-foreground">
                  Auto-calculated based on package type
                </p>
              )}
            </div>
          )}

          {/* Subscription Payment Day - Only for subscriptions */}
          {isSubscription && (
            <div className="space-y-2">
              <Label htmlFor="payment-day">
                Payment Day ({paymentSchedule.includes('weekly') ? 'of week' : 'of month'}) *
              </Label>
              <Input 
                id="payment-day" 
                type="number" 
                min="1" 
                max={paymentSchedule.includes('weekly') ? "7" : "31"}
                value={subscriptionPaymentDay}
                onChange={(e) => setSubscriptionPaymentDay(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {paymentSchedule.includes('weekly') 
                  ? "1 = Monday, 7 = Sunday" 
                  : "Day of the month (1-31)"}
              </p>
            </div>
          )}

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {CURRENCY_OPTIONS.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.flag} {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => {
                // TODO: Generate payment link
                toast({
                  title: "Coming Soon",
                  description: "Payment link generation will be available soon",
                });
              }}
              disabled={loading}
            >
              <LinkIcon className="h-4 w-4" />
              Generate Payment Link
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => {
                // TODO: Generate contract
                toast({
                  title: "Coming Soon",
                  description: "Contract generation will be available soon",
                });
              }}
              disabled={loading}
            >
              <FileText className="h-4 w-4" />
              Generate Contract
            </Button>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => { 
                resetForm(); 
                onOpenChange(false); 
              }} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Package
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
