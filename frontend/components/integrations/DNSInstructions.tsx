"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";

interface DNSInstructionsProps {
  expectedIP: string;
  onCopy: (text: string) => void;
}

export function DNSInstructions({ expectedIP, onCopy }: DNSInstructionsProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="space-y-4">
      {/* Main Instructions Toggle */}
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        <span>How to Set Up Your Custom Domain</span>
        {showInstructions ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {showInstructions && (
        <Card className="border-2">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Follow these steps to configure your DNS:</h4>
              
              <ol className="space-y-2 list-decimal list-inside text-sm">
                <li>Log in to your domain provider</li>
                <li>Navigate to DNS settings</li>
                <li>Add an A record with these details:</li>
              </ol>

              {/* DNS Record Details */}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p className="text-muted-foreground">A</p>
                    </div>
                    <div>
                      <span className="font-medium">Name:</span>
                      <p className="text-muted-foreground">payments (or your subdomain)</p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Value:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-background rounded border font-mono text-sm">
                          {expectedIP}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCopy(expectedIP)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">TTL:</span>
                      <p className="text-muted-foreground">Auto or 3600</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ol start={4} className="space-y-2 list-decimal list-inside text-sm">
                <li>Click "Validate" below once you've added the record</li>
              </ol>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-500">⚠️</span>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  DNS changes can take 5-60 minutes to propagate
                </p>
              </div>
            </div>

            {/* Provider-Specific Instructions */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Instructions for Popular Providers</h4>
              
              <Accordion type="single" collapsible className="w-full">
                {/* Namecheap */}
                <AccordionItem value="namecheap">
                  <AccordionTrigger className="text-sm">Namecheap</AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li>Go to Dashboard → Domain List</li>
                      <li>Click "Manage" next to your domain</li>
                      <li>Go to "Advanced DNS" tab</li>
                      <li>Click "Add New Record"</li>
                      <li>Select Type: A Record</li>
                      <li>Host: your-subdomain</li>
                      <li>Value: {expectedIP}</li>
                      <li>TTL: Automatic</li>
                      <li>Save changes</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* GoDaddy */}
                <AccordionItem value="godaddy">
                  <AccordionTrigger className="text-sm">GoDaddy</AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li>Go to your GoDaddy account</li>
                      <li>Select "My Products"</li>
                      <li>Next to Domains, select "Manage All"</li>
                      <li>Select your domain</li>
                      <li>Select "DNS" tab</li>
                      <li>Click "Add"</li>
                      <li>Select Type: A</li>
                      <li>Name: your-subdomain</li>
                      <li>Value: {expectedIP}</li>
                      <li>TTL: 1 Hour</li>
                      <li>Save</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* Cloudflare */}
                <AccordionItem value="cloudflare">
                  <AccordionTrigger className="text-sm">Cloudflare</AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li>Log in to Cloudflare dashboard</li>
                      <li>Select your domain</li>
                      <li>Go to "DNS" section</li>
                      <li>Click "Add record"</li>
                      <li>Type: A</li>
                      <li>Name: your-subdomain</li>
                      <li>IPv4 address: {expectedIP}</li>
                      <li>Proxy status: DNS only (gray cloud)</li>
                      <li>TTL: Auto</li>
                      <li>Save</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* Google Domains */}
                <AccordionItem value="google">
                  <AccordionTrigger className="text-sm">Google Domains</AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li>Sign in to Google Domains</li>
                      <li>Select your domain</li>
                      <li>Click "DNS" in the left menu</li>
                      <li>Scroll to "Custom resource records"</li>
                      <li>Name: your-subdomain</li>
                      <li>Type: A</li>
                      <li>TTL: 1H</li>
                      <li>Data: {expectedIP}</li>
                      <li>Click "Add"</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* Route 53 */}
                <AccordionItem value="route53">
                  <AccordionTrigger className="text-sm">AWS Route 53</AccordionTrigger>
                  <AccordionContent>
                    <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                      <li>Open Route 53 console</li>
                      <li>Click "Hosted zones"</li>
                      <li>Select your domain</li>
                      <li>Click "Create record"</li>
                      <li>Record name: your-subdomain</li>
                      <li>Record type: A</li>
                      <li>Value: {expectedIP}</li>
                      <li>TTL: 300</li>
                      <li>Routing policy: Simple</li>
                      <li>Create records</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                {/* Other Providers */}
                <AccordionItem value="other">
                  <AccordionTrigger className="text-sm">Other Providers</AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        Look for "DNS Management" or "DNS Records" in your domain provider's dashboard.
                      </p>
                      <p>
                        Add an A record with the following details:
                      </p>
                      <ul className="list-disc list-inside pl-4 space-y-1">
                        <li>Type: A</li>
                        <li>Host/Name: your-subdomain</li>
                        <li>Points to/Value: {expectedIP}</li>
                        <li>TTL: Auto or 3600</li>
                      </ul>
                      <p className="pt-2">
                        If you need help, contact your domain provider's support team.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
