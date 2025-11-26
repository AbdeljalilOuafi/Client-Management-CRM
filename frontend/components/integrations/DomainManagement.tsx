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
  ExternalLink,
  Globe
} from "lucide-react";
import { DomainStatusIndicator } from "./DomainStatusIndicator";
import { DNSInstructions } from "./DNSInstructions";

const EXPECTED_IP = "13.51.251.199";
const POLL_INTERVAL = 30000; // 30 seconds
const MAX_ATTEMPTS = 20; // 10 minutes total

type ValidationStatus = "not_set" | "validating" | "verified" | "failed";

interface DomainState {
  subdomain: string;
  status: ValidationStatus;
  lastChecked: string | null;
  validationAttempts: number;
  verifiedIP: string | null;
}

export function DomainManagement() {
  // Forms subdomain state
  const [formsSubdomain, setFormsSubdomain] = useState("");
  const [formsStatus, setFormsStatus] = useState<ValidationStatus>("not_set");
  const [formsLastChecked, setFormsLastChecked] = useState<Date | null>(null);
  const [formsValidationAttempts, setFormsValidationAttempts] = useState(0);
  const [formsVerifiedIP, setFormsVerifiedIP] = useState<string | null>(null);
  const [formsPollingInterval, setFormsPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [formsErrorMessage, setFormsErrorMessage] = useState<string>("");
  
  // Payment subdomain request state
  const [paymentSubdomain, setPaymentSubdomain] = useState("");
  const [paymentReason, setPaymentReason] = useState("");
  const [paymentRequestStatus, setPaymentRequestStatus] = useState<"idle" | "submitting" | "submitted">("idle");

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("formsSubdomainState");
      if (saved) {
        try {
          const state: DomainState = JSON.parse(saved);
          setFormsSubdomain(state.subdomain || "");
          setFormsStatus(state.status || "not_set");
          setFormsLastChecked(state.lastChecked ? new Date(state.lastChecked) : null);
          setFormsValidationAttempts(state.validationAttempts || 0);
          setFormsVerifiedIP(state.verifiedIP || null);

          // Resume polling if it was validating
          if (state.status === "validating" && state.subdomain) {
            resumeValidation(state.subdomain, state.validationAttempts);
          }
        } catch (error) {
          console.error("Failed to load forms subdomain state:", error);
        }
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const state: DomainState = {
        subdomain: formsSubdomain,
        status: formsStatus,
        lastChecked: formsLastChecked?.toISOString() || null,
        validationAttempts: formsValidationAttempts,
        verifiedIP: formsVerifiedIP,
      };
      localStorage.setItem("formsSubdomainState", JSON.stringify(state));
    }
  }, [formsSubdomain, formsStatus, formsLastChecked, formsValidationAttempts, formsVerifiedIP]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (formsPollingInterval) {
        clearInterval(formsPollingInterval);
      }
    };
  }, [formsPollingInterval]);

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

  const resumeValidation = async (domain: string, currentAttempts: number) => {
    setFormsStatus("validating");
    
    let attempts = currentAttempts;
    
    const interval = setInterval(async () => {
      attempts++;
      setFormsValidationAttempts(attempts);
      setFormsLastChecked(new Date());
      
      const result = await validateDomain(domain);
      
      if (result.success) {
        setFormsStatus("verified");
        setFormsVerifiedIP(result.ip || EXPECTED_IP);
        clearInterval(interval);
        setFormsPollingInterval(null);
        toast.success("Domain verified successfully!");
      } else if (attempts >= MAX_ATTEMPTS) {
        setFormsStatus("failed");
        setFormsErrorMessage(result.message);
        clearInterval(interval);
        setFormsPollingInterval(null);
      } else {
        setFormsErrorMessage(result.message);
      }
    }, POLL_INTERVAL);
    
    setFormsPollingInterval(interval);
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleFormsSubmit = async () => {
    console.log("Submitting forms subdomain:", {
      subdomain: formsSubdomain,
      validated: true,
      ip_verified: formsVerifiedIP,
      validated_at: new Date().toISOString(),
      type: "forms"
    });

    toast.success("Forms subdomain configuration saved!");
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
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setPaymentSubdomain("");
        setPaymentReason("");
        setPaymentRequestStatus("idle");
      }, 2000);
    }, 1500);
  };

  const getCompanyName = () => {
    return "yourcompany";
  };

  return (
    <div className="space-y-8">
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
          {/* Current Status */}
          {formsStatus === "verified" && formsSubdomain ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Active: {formsSubdomain}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your forms are accessible at: https://{formsSubdomain}/forms/*
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFormsStatus("not_set");
                      setFormsSubdomain("");
                      setFormsVerifiedIP(null);
                    }}
                  >
                    Change
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold">Using default: {getCompanyName()}.fithq.com</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Form links: https://{getCompanyName()}.fithq.com/forms/*
                </p>
              </AlertDescription>
            </Alert>
          )}

          {formsStatus !== "verified" && (
            <>
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
                  disabled={formsStatus === "validating"}
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

              {/* Action Buttons */}
              <div className="flex gap-3">
                {formsStatus === "not_set" && (
                  <Button 
                    onClick={startValidation}
                    disabled={!formsSubdomain.trim()}
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
                    <Button onClick={startValidation} className="flex-1" size="lg">
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
              </div>
            </>
          )}

          {formsStatus === "verified" && (
            <Button onClick={handleFormsSubmit} className="w-full" size="lg">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save Forms Subdomain Configuration
            </Button>
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
                    disabled={paymentRequestStatus === "submitting"}
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
                    disabled={paymentRequestStatus === "submitting"}
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
                disabled={!paymentSubdomain.trim() || paymentRequestStatus === "submitting"}
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
    </div>
  );
}
