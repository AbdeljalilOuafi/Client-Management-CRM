"use client";

import { Client } from "@/lib/api/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Package,
  AlertCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ExpandedClientRowProps {
  client: Client;
}

export function ExpandedClientRow({ client }: ExpandedClientRowProps) {
  return (
    <div className="p-6 bg-muted/30 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">First Name</p>
                <p className="font-medium">{client.first_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Last Name</p>
                <p className="font-medium">{client.last_name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="font-medium">{client.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="font-medium">{client.phone || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Instagram</p>
                <p className="font-medium">{client.instagram_handle || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Date of Birth</p>
                <p className="font-medium">{client.dob || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Address
                </p>
                <p className="font-medium">{client.address || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Country</p>
                <p className="font-medium">{client.country || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">State</p>
                <p className="font-medium">{client.state || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Client ID</p>
                <p className="font-medium font-mono">{client.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Start Date
                </p>
                <p className="font-medium">{client.client_start_date || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> End Date
                </p>
                <p className="font-medium">{client.client_end_date || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Default Currency</p>
                <p className="font-medium">{client.currency || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Lead Origin</p>
                <p className="font-medium">{client.lead_origin || client.cta_lead_origin || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">GHL ID</p>
                <p className="font-medium font-mono text-xs">{client.ghl_id || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Coach</p>
                <p className="font-medium">{client.coach_name || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Closer</p>
                <p className="font-medium">{client.closer || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Setter</p>
                <p className="font-medium">{client.setter || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Package Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Current Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Package Name</p>
                <p className="font-medium">{client.package_type || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Start Date</p>
                <p className="font-medium">{client.start_date || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">End Date</p>
                <p className="font-medium">{client.end_date || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Months on Package</p>
                <p className="font-medium">{client.number_months_paid || client.no_months || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Minimum Term</p>
                <p className="font-medium">{client.minimum_term ? `${client.minimum_term} months` : "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Notice Given</p>
                <Badge variant={client.notice_given ? "destructive" : "secondary"}>
                  {client.notice_given ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">No More Payments</p>
                <Badge variant={client.no_more_payments ? "secondary" : "default"}>
                  {client.no_more_payments ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stripe & Payment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Payment Method</p>
                <p className="font-medium">{client.payment_method || "Stripe"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Payment Plan</p>
                <p className="font-medium">{client.payment_plan || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Stripe Customer ID</p>
                <p className="font-medium font-mono text-xs">{client.stripe_customer_id || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Latest Payment
                </p>
                <p className="font-medium">
                  {client.latest_payment_amount 
                    ? `${client.currency || 'USD'} ${client.latest_payment_amount.toFixed(2)}`
                    : "-"
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Latest Payment Date
                </p>
                <p className="font-medium">{client.latest_payment_date || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Next Payment Date</p>
                <p className="font-medium">{client.next_payment_date || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">LTV (Lifetime Value)</p>
                <p className="font-medium">
                  {client.ltv 
                    ? `${client.currency || 'USD'} ${client.ltv.toFixed(2)}`
                    : "-"
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Payment Amount</p>
                <p className="font-medium">
                  {client.payment_amount 
                    ? `${client.currency || 'USD'} ${client.payment_amount.toFixed(2)}`
                    : "-"
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Day of Month</p>
                <p className="font-medium">{client.day_of_month_payment || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information Sections */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="previous-packages">
          <AccordionTrigger className="text-sm font-semibold">
            Previous Packages
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                TODO: Backend integration needed - Display list of previous packages with Package Name, Start Date, End Date, and Duration
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="status-changes">
          <AccordionTrigger className="text-sm font-semibold">
            Client Status Change Schedule
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                TODO: Backend integration needed - Display pending status changes (pause/stop/package change) with date and type
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="payment-schedules">
          <AccordionTrigger className="text-sm font-semibold">
            Pending Payment Schedules
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                TODO: Backend integration needed - Display upcoming scheduled payments (Date, Amount, Status)
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="payment-history">
          <AccordionTrigger className="text-sm font-semibold">
            Payment History
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                TODO: Backend integration needed - Display table of past payments (Date, Amount, Status, Method)
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
