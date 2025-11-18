"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { listClients } from "@/lib/api/clients";
import { cn } from "@/lib/utils";

interface PaymentFormData {
  clientName: string;
  clientId: string;
  amount: string;
  currency: string;
  payment_method: string;
  payment_date: string;
  notes: string;
  autoCharge: boolean;
}

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface FormErrors {
  clientId?: string;
  amount?: string;
  currency?: string;
  payment_method?: string;
  payment_date?: string;
}

export const AddPaymentDialog = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    clientName: '',
    clientId: '',
    amount: '',
    currency: '',
    payment_method: '',
    payment_date: '',
    notes: '',
    autoCharge: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch clients with search
  useEffect(() => {
    const fetchClients = async () => {
      setSearchLoading(true);
      try {
        const response = await listClients({
          search: searchQuery || undefined,
          status: "active",
          page_size: 50,
        });
        
        const mappedClients = response.results.map(client => ({
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
        }));
        
        setClients(mappedClients);
      } catch (error) {
        console.error("Failed to load clients:", error);
      } finally {
        setSearchLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      if (open) {
        fetchClients();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open]);

  const handleClientSelect = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientName: `${client.first_name} ${client.last_name}`,
        clientId: client.id.toString(),
      }));
      setClientPopoverOpen(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate client
    if (!formData.clientId) {
      newErrors.clientId = "Client is required";
    }

    // Validate amount
    if (!formData.amount) {
      newErrors.amount = "Amount is required";
    } else if (Number(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    // Validate currency
    if (!formData.currency) {
      newErrors.currency = "Currency is required";
    }

    // Validate payment method
    if (!formData.payment_method) {
      newErrors.payment_method = "Payment method is required";
    }

    // Validate payment date
    if (!formData.payment_date) {
      newErrors.payment_date = "Payment date is required";
    } else {
      const selectedDate = new Date(formData.payment_date);
      if (isNaN(selectedDate.getTime())) {
        newErrors.payment_date = "Invalid date format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // TODO: Connect to backend
  const handleAddPayment = async (paymentData: PaymentFormData) => {
    // Will post to: POST /api/payments
    console.log("Creating payment:", paymentData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: "Success",
      description: "Payment created successfully",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await handleAddPayment(formData);
      
      // Reset form and close dialog
      setFormData({
        clientName: '',
        clientId: '',
        amount: '',
        currency: '',
        payment_method: '',
        payment_date: '',
        notes: '',
        autoCharge: false,
      });
      setErrors({});
      setSearchQuery("");
      setOpen(false);
    } catch (error) {
      console.error("Failed to create payment:", error);
      toast({
        title: "Error",
        description: "Failed to create payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      clientName: '',
      clientId: '',
      amount: '',
      currency: '',
      payment_method: '',
      payment_date: '',
      notes: '',
      autoCharge: false,
    });
    setErrors({});
    setSearchQuery("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
          <DialogDescription>
            Create a new payment record for a client
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label>
                  Client <span className="text-red-500">*</span>
                </Label>
                <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientPopoverOpen}
                      className={cn(
                        "w-full justify-between bg-background",
                        errors.clientId && "border-red-500"
                      )}
                    >
                      {formData.clientName || "Select client..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search clients..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {searchLoading ? "Searching..." : "No client found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={`${client.first_name} ${client.last_name} ${client.email}`}
                              onSelect={() => handleClientSelect(client.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.clientId === client.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.first_name} {client.last_name} ({client.email})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.clientId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.clientId}
                  </p>
                )}
              </div>

              {/* Amount Field */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.amount}
                  </p>
                )}
              </div>

              {/* Currency Field */}
              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger 
                    id="currency" 
                    className={errors.currency ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.currency}
                  </p>
                )}
              </div>

              {/* Payment Method Field */}
              <div className="space-y-2">
                <Label htmlFor="payment_method">
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger 
                    id="payment_method" 
                    className={errors.payment_method ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.payment_method && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.payment_method}
                  </p>
                )}
              </div>

              {/* Auto-charge checkbox for Stripe */}
              {formData.payment_method === "stripe" && (
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="autoCharge"
                    checked={formData.autoCharge}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, autoCharge: checked as boolean }))
                    }
                  />
                  <Label
                    htmlFor="autoCharge"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Do you want to auto-charge the client now?
                  </Label>
                </div>
              )}

              {/* Payment Date Field */}
              <div className="space-y-2">
                <Label htmlFor="payment_date">
                  Payment Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  className={errors.payment_date ? "border-red-500" : ""}
                />
                {errors.payment_date && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.payment_date}
                  </p>
                )}
              </div>

              {/* Notes Field (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Payment"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
