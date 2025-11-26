"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Copy,
  AlertCircle,
  RefreshCw,
  FileText,
  CreditCard,
  Send,
  Globe,
  Trash2,
  Edit
} from "lucide-react";
import { DomainStatusIndicator } from "./DomainStatusIndicator";
import { DNSInstructions } from "./DNSInstructions";
import { usePermissions } from "@/hooks/usePermissions";

const EXPECTED_IP = "13.51.251.199";
const POLL_INTERVAL = 30000; // 30 seconds
const MAX_ATTEMPTS = 20; // 10 minutes total
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ValidationStatus = "not_set" | "validating" | "verified" | "failed";
type ConfigurationStep = "idle" | "configuring" | "generating_ssl" | "updating_links" | "complete";

interface DomainConfig {
  forms_domain: string | null;
  forms_domain_verified: boolean;
  forms_domain_configured: boolean;
  forms_domain_added_at: string | null;
}

interface ConfigureResponse {
  success: boolean;
  message: string;
  domain?: string;
  configured_at?: string;
  ssl_status?: string;
  nginx_status?: string;
  error?: string;
  details?: string;
}

interface RegenerateResponse {
  success: boolean;
  message: string;
  stats: {
    total_count: number;
    success_count: number;
    fail_count: number;
  };
}

export function DomainManagementIntegrated() {
  const { isSuperAdmin } = usePermissions();
  
  // Forms subdomain state
  const [formsSubdomain, setFormsSubdomain] = useState("");
  const [formsStatus, setFormsStatus] = useState<ValidationStatus>("not_set");
  const [formsLastChecked, setFormsLastChecked] = useState<Date | null>(null);
  const [formsValidationAttempts, setFormsValidationAttempts] = useState(0);
  const [formsVerifiedIP, setFormsVerifiedIP] = useState<string | null>(null);
  const [formsPollingInterval, setFormsPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [formsErrorMessage, setFormsErrorMessage] = useState<string>("");
  const [domainConfigured, setDomainConfigured] = useState(false);
  const [domainAddedAt, setDomainAddedAt] = useState<string | null>(null);
  
  // Configuration state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [configStep, setConfigStep] = useState<ConfigurationStep>("idle");
  const [configProgress, setConfigProgress] = useState(0);
  const [linkStats, setLinkStats] = useState<RegenerateResponse["stats"] | null>(null);
  
  // Dialog states
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Payment subdomain request state
  const [paymentSubdomain, setPaymentSubdomain] = useState("");
  const [paymentReason, setPaymentReason] = useState("");
  const [paymentRequestStatus, setPaymentRequestStatus] = useState<"idle" | "submitting" | "submitted">("idle");
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current domain configuration on mount
  useEffect(() => {
    fetchCurrentDomain();
  }, []);

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token");
    }
    return null;
  };

  const getCompanyName = () => {
    // TODO: Get from user's account data
    return "yourcompany";
  };

  const fetchCurrentDomain = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/domains/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch domain configuration');
      }

      const data: DomainConfig = await response.json();
      
      if (data.forms_domain) {
        setFormsSubdomain(data.forms_domain);
        setFormsStatus(data.forms_domain_verified ? 'verified' : 'not_set');
        setDomainConfigured(data.forms_domain_configured);
        setDomainAddedAt(data.forms_domain_added_at);
        
        if (data.forms_domain_verified) {
          setFormsVerifiedIP(EXPECTED_IP);
        }
      }
    } catch (error) {
      console.error('Failed to fetch domain config:', error);
      toast.error('Failed to load domain configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const validateDomain = async (domain: string): Promise<{ success: boolean; ip?: string; message: string }> => {
    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=A`,
        { cache: "no-store" }
      );
      
      if (!response.ok) {
        throw new Error("DNS lookup failed");
      }

      const data = await response.json();
      
      if (data.Answer && data.Answer.length > 0) {
        const aRecords = data.Answer.filter((r: any) => r.type === 1);
        
        if (aRecords.length === 0) {
          return {
            success: false,
            message: "No A record found for this domain",
          };
        }

        const foundIP = aRecords[0].data;
        const hasCorrectIP = aRecords.some((r: any) => r.data === EXPECTED_IP);
        
        return {
          success: hasCorrectIP,
          ip: foundIP,
          message: hasCorrectIP 
            ? "Domain verified successfully!" 
            : `Found IP: ${foundIP}, expected: ${EXPECTED_IP}`,
        };
      }
      
      return {
        success: false,
        message: "No A record found for this domain",
      };
    } catch (error) {
      console.error("DNS validation error:", error);
      return {
        success: false,
        message: "Failed to check DNS. Please try again.",
      };
    }
  };

  const startValidation = useCallback(async () => {
    if (!formsSubdomain.trim()) {
      toast.error("Please enter a subdomain");
      return;
    }

    if (formsPollingInterval) {
      clearInterval(formsPollingInterval);
    }

    setFormsStatus("validating");
    setFormsValidationAttempts(0);
    setFormsErrorMessage("");
    setFormsLastChecked(new Date());

    const result = await validateDomain(formsSubdomain);
    
    if (result.success) {
      setFormsStatus("verified");
      setFormsVerifiedIP(result.ip || EXPECTED_IP);
      toast.success("Domain verified successfully!");
      return;
    }

    setFormsErrorMessage(result.message);
    let attempts = 1;
    setFormsValidationAttempts(attempts);

    const interval = setInterval(async () => {
      attempts++;
      setFormsValidationAttempts(attempts);
      setFormsLastChecked(new Date());
      
      const pollResult = await validateDomain(formsSubdomain);
      
      if (pollResult.success) {
        setFormsStatus("verified");
        setFormsVerifiedIP(pollResult.ip || EXPECTED_IP);
        clearInterval(interval);
        setFormsPollingInterval(null);
        toast.success("Domain verified successfully!");
      } else if (attempts >= MAX_ATTEMPTS) {
        setFormsStatus("failed");
        setFormsErrorMessage(pollResult.message);
        clearInterval(interval);
        setFormsPollingInterval(null);
        toast.error("DNS validation timed out. Please check your DNS settings and try again.");
      } else {
        setFormsErrorMessage(pollResult.message);
      }
    }, POLL_INTERVAL);
    
    setFormsPollingInterval(interval);
  }, [formsSubdomain, formsPollingInterval]);

  const cancelValidation = () => {
    if (formsPollingInterval) {
      clearInterval(formsPollingInterval);
      setFormsPollingInterval(null);
    }
    setFormsStatus("failed");
    if (!formsErrorMessage) {
      setFormsErrorMessage("Validation cancelled by user");
    }
    toast.info("Validation stopped. Click 'Retry Validation' to try again.");
  };

  const submitDomain = async () => {
    if (formsStatus !== 'verified') {
      toast.error('Please validate DNS before submitting');
      return;
    }

    if (!isSuperAdmin()) {
      toast.error('Only Super Admins can configure custom domains');
      return;
    }

    setIsSubmitting(true);
    setConfigStep("configuring");
    setConfigProgress(10);

    try {
      const token = getAuthToken();

      // Step 1: Configure domain with SSL and Nginx
      setConfigProgress(20);
      toast.info('Configuring domain and generating SSL certificate...');
      
      const configResponse = await fetch(`${API_BASE_URL}/api/domains/configure/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          forms_domain: formsSubdomain
        })
      });

      const configData: ConfigureResponse = await configResponse.json();

      if (!configResponse.ok) {
        // Handle specific error cases
        if (configData.error?.includes('already in use')) {
          throw new Error('This domain is already taken by another account');
        } else if (configData.error?.includes('SSL certificate generation failed')) {
          throw new Error('SSL setup failed. Please verify your DNS is pointing to ' + EXPECTED_IP);
        } else if (configData.error?.includes('Invalid domain format')) {
          throw new Error('Invalid domain format. Use format: subdomain.domain.com');
        }
        throw new Error(configData.error || 'Failed to configure domain');
      }

      setConfigStep("generating_ssl");
      setConfigProgress(60);
      toast.info('SSL certificate generated successfully!');

      // Step 2: Regenerate all client links
      setConfigStep("updating_links");
      setConfigProgress(80);
      toast.info('Updating client links...');

      const regenResponse = await fetch(`${API_BASE_URL}/api/domains/regenerate-links/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const regenData: RegenerateResponse = await regenResponse.json();

      if (!regenResponse.ok) {
        throw new Error('Failed to regenerate client links');
      }

      setConfigStep("complete");
      setConfigProgress(100);
      setLinkStats(regenData.stats);
      setDomainConfigured(true);
      setDomainAddedAt(configData.configured_at || new Date().toISOString());

      // Show detailed success message
      toast.success(
        `Domain configured successfully! ${regenData.stats.success_count} client links updated.`,
        { duration: 5000 }
      );

    } catch (error: any) {
      setConfigStep("idle");
      setConfigProgress(0);
      toast.error(error.message || 'Configuration failed');
      console.error('Domain configuration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeDomain = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/domains/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove domain');
      }

      toast.success('Domain removed. Reverted to default domain.');

      // Reset UI
      setFormsSubdomain('');
      setFormsStatus('not_set');
      setDomainConfigured(false);
      setDomainAddedAt(null);
      setFormsVerifiedIP(null);
      setLinkStats(null);
      setConfigStep('idle');
      setConfigProgress(0);
      setShowDeleteDialog(false);

    } catch (error: any) {
      toast.error(error.message || 'Failed to remove domain');
      console.error('Domain removal error:', error);
    }
  };

  const handleChangeDomain = () => {
    setShowChangeDialog(false);
    setFormsStatus('not_set');
    setDomainConfigured(false);
    setFormsSubdomain('');
    setFormsVerifiedIP(null);
    setLinkStats(null);
    setConfigStep('idle');
    setConfigProgress(0);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handlePaymentRequest = async () => {
    if (!paymentSubdomain.trim()) {
      toast.error("Please enter a subdomain");
      return;
    }

    setPaymentRequestStatus("submitting");

    // Simulate API call
    setTimeout(() => {
      console.log("Payment subdomain request:", {
        subdomain: paymentSubdomain,
        reason: paymentReason,
        requested_at: new Date().toISOString(),
        type: "payment"
      });

      setPaymentRequestStatus("submitted");
      toast.success("Payment subdomain request submitted! We'll contact you soon.");
      
      setTimeout(() => {
        setPaymentSubdomain("");
        setPaymentReason("");
        setPaymentRequestStatus("idle");
      }, 2000);
    }, 1500);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (formsPollingInterval) {
        clearInterval(formsPollingInterval);
      }
    };
  }, [formsPollingInterval]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Permission Check */}
      {!isSuperAdmin() && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold">Super Admin Access Required</p>
            <p className="text-sm mt-1">
              Only Super Admins can configure custom domains. Please contact your administrator.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Custom Domain Management</CardTitle>
              <CardDescription className="mt-1">
                Configure custom subdomains for your forms and payment links
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Forms Subdomain</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Set up your own subdomain for check-in forms and questionnaires
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
              <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Payment Subdomain</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Request a custom subdomain for payment links (requires approval)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms Subdomain Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Forms Subdomain Setup</CardTitle>
              <CardDescription>
                Configure your custom subdomain for client forms and check-ins
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status - Configured Domain */}
          {domainConfigured && formsSubdomain ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100 text-lg">
                        ✓ Active: {formsSubdomain}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Your forms are accessible at: https://{formsSubdomain}/forms/*
                      </p>
                      {domainAddedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Configured on: {new Date(domainAddedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Link Stats */}
                    {linkStats && (
                      <div className="bg-white dark:bg-green-900/20 rounded-lg p-3 space-y-2">
                        <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">
                          Client Links Status:
                        </h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-semibold text-green-900 dark:text-green-100">
                              {linkStats.total_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Updated</p>
                            <p className="font-semibold text-green-600">
                              {linkStats.success_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Failed</p>
                            <p className="font-semibold text-red-600">
                              {linkStats.fail_count}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowChangeDialog(true)}
                        disabled={!isSuperAdmin()}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Change Domain
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={!isSuperAdmin()}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove Domain
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              {/* Default Domain Status */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">Using default: {getCompanyName()}.fithq.ai</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Forms URL: https://{getCompanyName()}.fithq.ai/forms/checkin
                  </p>
                </AlertDescription>
              </Alert>

              {/* Subdomain Input */}
              <div className="space-y-2">
                <Label htmlFor="forms-subdomain" className="text-base font-semibold">
                  Your Forms Subdomain
                </Label>
                <Input
                  id="forms-subdomain"
                  placeholder="forms.yourbusiness.com"
                  value={formsSubdomain}
                  onChange={(e) => setFormsSubdomain(e.target.value)}
                  disabled={formsStatus === "validating" || !isSuperAdmin()}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Example: forms.yourbusiness.com or checkin.yourcompany.com
                </p>
              </div>

              {/* DNS Instructions */}
              <DNSInstructions 
                expectedIP={EXPECTED_IP}
                onCopy={copyToClipboard}
              />

              {/* Domain Status Indicator */}
              {formsSubdomain && (
                <DomainStatusIndicator
                  status={formsStatus}
                  lastChecked={formsLastChecked}
                  errorMessage={formsErrorMessage}
                  validationAttempts={formsValidationAttempts}
                  maxAttempts={MAX_ATTEMPTS}
                />
              )}

              {/* Error Message */}
              {formsStatus === "failed" && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {formsErrorMessage}
                    <div className="mt-2 text-sm">
                      Please check your DNS settings and click "Retry Validation" when ready.
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Configuration Progress */}
              {isSubmitting && (
                <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      {configStep === "configuring" && "⏳ Step 1/3: Configuring domain..."}
                      {configStep === "generating_ssl" && "⏳ Step 2/3: Generating SSL certificate (1-2 minutes)..."}
                      {configStep === "updating_links" && "⏳ Step 3/3: Updating client links..."}
                      {configStep === "complete" && "✅ Complete! Your domain is configured."}
                    </p>
                  </div>
                  <Progress value={configProgress} className="h-2" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    This may take 1-2 minutes. Please wait...
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {formsStatus === "not_set" && (
                  <Button 
                    onClick={startValidation}
                    disabled={!formsSubdomain.trim() || !isSuperAdmin()}
                    className="flex-1"
                    size="lg"
                  >
                    Validate Domain
                  </Button>
                )}

                {formsStatus === "validating" && (
                  <>
                    <Button disabled className="flex-1" size="lg">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating... ({formsValidationAttempts}/{MAX_ATTEMPTS})
                    </Button>
                    <Button variant="outline" onClick={cancelValidation} size="lg">
                      Stop Validation
                    </Button>
                  </>
                )}

                {formsStatus === "failed" && (
                  <>
                    <Button onClick={startValidation} className="flex-1" size="lg" disabled={!isSuperAdmin()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Validation
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFormsStatus("not_set");
                        setFormsValidationAttempts(0);
                        setFormsErrorMessage("");
                        setFormsSubdomain("");
                      }}
                      size="lg"
                    >
                      Reset
                    </Button>
                  </>
                )}

                {formsStatus === "verified" && !isSubmitting && (
                  <Button 
                    onClick={submitDomain} 
                    className="w-full" 
                    size="lg"
                    disabled={!isSuperAdmin()}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Domain Configuration
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Payment Subdomain Request Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Payment Subdomain Request</CardTitle>
              <CardDescription>
                Request a custom subdomain for your payment links (requires manual approval)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              <p className="font-semibold">Manual Approval Required</p>
              <p className="text-sm mt-1">
                Payment subdomains require additional verification and SSL certificate setup. 
                Our team will review your request and contact you within 24-48 hours.
              </p>
            </AlertDescription>
          </Alert>

          {paymentRequestStatus === "submitted" ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Request Submitted Successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  We'll review your payment subdomain request and contact you soon.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-subdomain" className="text-base font-semibold">
                    Desired Payment Subdomain
                  </Label>
                  <Input
                    id="payment-subdomain"
                    placeholder="pay.yourbusiness.com"
                    value={paymentSubdomain}
                    onChange={(e) => setPaymentSubdomain(e.target.value)}
                    disabled={paymentRequestStatus === "submitting" || !isSuperAdmin()}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: pay.yourbusiness.com or payments.yourcompany.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-reason" className="text-base font-semibold">
                    Business Use Case <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Textarea
                    id="payment-reason"
                    placeholder="Tell us about your business and why you need a custom payment subdomain..."
                    value={paymentReason}
                    onChange={(e) => setPaymentReason(e.target.value)}
                    disabled={paymentRequestStatus === "submitting" || !isSuperAdmin()}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Help us understand your needs to expedite the approval process
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">What happens next?</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>We'll verify your domain ownership</li>
                  <li>Set up SSL certificates for secure payments</li>
                  <li>Configure payment gateway integration</li>
                  <li>Notify you when your subdomain is ready</li>
                </ol>
              </div>

              <Button 
                onClick={handlePaymentRequest}
                disabled={!paymentSubdomain.trim() || paymentRequestStatus === "submitting" || !isSuperAdmin()}
                className="w-full"
                size="lg"
              >
                {paymentRequestStatus === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Payment Subdomain Request
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Domain Dialog */}
      <AlertDialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Custom Domain?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing your domain will require DNS reconfiguration and SSL certificate regeneration. 
              All client links will need to be updated. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeDomain}>
              Yes, Change Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Domain Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Custom Domain?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your custom domain and revert to the default domain ({getCompanyName()}.fithq.ai). 
              All client links will be automatically regenerated with the default domain. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeDomain} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Remove Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
