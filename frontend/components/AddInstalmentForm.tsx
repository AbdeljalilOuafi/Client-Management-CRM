import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { listClients, Client as ApiClient } from "@/lib/api/clients";
import { createInstalment } from "@/lib/api/instalments";

// Format input to 2 decimal places on blur
const formatToTwoDecimals = (e: React.FocusEvent<HTMLInputElement>) => {
  const value = e.target.value;
  if (value && !isNaN(parseFloat(value))) {
    e.target.value = parseFloat(value).toFixed(2);
  }
};

// Restrict input to max 2 decimal places while typing
const handleDecimalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  if (value === '') return;
  const parts = value.split('.');
  if (parts.length === 2 && parts[1].length > 2) {
    e.target.value = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
};

interface AddInstalmentFormProps {
  onSuccess: () => void;
}

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export const AddInstalmentForm = ({ onSuccess }: AddInstalmentFormProps) => {
  const [formData, setFormData] = useState({
    clientName: "",
    clientId: "",
    instalmentAmount: "",
    currency: "USD",
    instalmentDatetime: "",
    instalmentNumber: "",
    invoiceId: "",
    stripeAccount: "",
    stripeCustomerId: "",
  });
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

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
        toast.error("Failed to load clients");
        console.error(error);
      } finally {
        setSearchLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchClients();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // When client is selected, populate client ID and fetch Stripe details
  const handleClientSelect = async (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        clientName: `${client.first_name} ${client.last_name}`,
        clientId: client.id.toString(),
      }));
      
      // TODO: Fetch client's Stripe details from backend
      // Example: GET /api/clients/{clientId}/stripe-details
      // When endpoint is ready, uncomment and implement:
      /*
      try {
        const stripeDetails = await fetchClientStripeDetails(clientId);
        setFormData(prev => ({
          ...prev,
          stripeAccount: stripeDetails.stripe_account || "",
          stripeCustomerId: stripeDetails.stripe_customer_id || "",
        }));
      } catch (error) {
        console.error("Failed to fetch Stripe details:", error);
      }
      */
    }
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate amount is not negative
      const amount = parseFloat(formData.instalmentAmount);
      if (amount < 0) {
        toast.error("Amount cannot be negative");
        setLoading(false);
        return;
      }

      // Validate instalment number is not negative if provided
      if (formData.instalmentNumber && parseInt(formData.instalmentNumber) < 0) {
        toast.error("Instalment number cannot be negative");
        setLoading(false);
        return;
      }

      // Convert datetime-local format to YYYY-MM-DD
      const scheduleDate = formData.instalmentDatetime.split('T')[0];
      
      // TODO: stripe_account and stripe_customer_id will be automatically fetched from the database
      // based on the selected client when the backend endpoint is ready
      await createInstalment({
        client: parseInt(formData.clientId),
        amount: formData.instalmentAmount,
        currency: formData.currency,
        schedule_date: scheduleDate,
        status: "open",
        instalment_number: formData.instalmentNumber ? parseInt(formData.instalmentNumber) : undefined,
        invoice_id: formData.invoiceId || undefined,
        // stripe_account and stripe_customer_id will be auto-populated by backend
      });

      toast.success("Instalment added successfully!");
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to add instalment";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      <div className="space-y-2">
        <Label>Client Name *</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-background"
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
      </div>

      {/* <div className="space-y-2">
        <Label htmlFor="clientId">Client ID (View Only)</Label>
        <Input
          id="clientId"
          value={formData.clientId}
          disabled
          className="bg-muted"
        />
      </div> */}

      <div className="space-y-2">
        <Label htmlFor="instalmentNumber">Instalment Number (Optional)</Label>
        <Input
          id="instalmentNumber"
          type="number"
          min="0"
          value={formData.instalmentNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, instalmentNumber: e.target.value }))}
          placeholder="1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="instalmentAmount">Instalment Amount *</Label>
        <Input
          id="instalmentAmount"
          type="number"
          min="0"
          step="0.01"
          value={formData.instalmentAmount}
          onChange={(e) => setFormData(prev => ({ ...prev, instalmentAmount: e.target.value }))}
          onInput={handleDecimalInput}
          onBlur={formatToTwoDecimals}
          required
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency *</Label>
        <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
          <SelectTrigger id="currency" className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="AED">AED</SelectItem>
            <SelectItem value="AUD">AUD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="instalmentDatetime">Date & Time to be Scheduled *</Label>
        <Input
          id="instalmentDatetime"
          type="datetime-local"
          value={formData.instalmentDatetime}
          onChange={(e) => setFormData(prev => ({ ...prev, instalmentDatetime: e.target.value }))}
          required
        />
      </div>

      {/* <div className="space-y-2">
        <Label htmlFor="invoiceId">Invoice ID (Optional)</Label>
        <Input
          id="invoiceId"
          value={formData.invoiceId}
          onChange={(e) => setFormData(prev => ({ ...prev, invoiceId: e.target.value }))}
          placeholder="INV-12345"
        />
      </div> */}

      <div className="space-y-2">
        <Label htmlFor="stripeAccount">Stripe Account (View Only)</Label>
        <Input
          id="stripeAccount"
          value={formData.stripeAccount}
          disabled
          className="bg-muted"
          placeholder="Will be auto-populated from client data"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stripeCustomerId">Stripe Customer ID (View Only)</Label>
        <Input
          id="stripeCustomerId"
          value={formData.stripeCustomerId}
          disabled
          className="bg-muted"
          placeholder="Will be auto-populated from client data"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Instalment"}
        </Button>
      </div>
    </form>
  );
};