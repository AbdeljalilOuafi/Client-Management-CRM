import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { listEmployees, Employee } from "@/lib/api/staff";
import { usePermissions } from "@/hooks/usePermissions";
import { createClient } from "@/lib/api/clients";
import { cn } from "@/lib/utils";
import { COUNTRY_CODES, getPopularCountries, getAllCountries, type Country } from "@/lib/country-codes";

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

const clientFormSchema = z.object({
  // Options
  generatePaymentLink: z.boolean().default(true),
  sendPaymentLinkToClient: z.boolean().default(false),
  generateContract: z.boolean().default(true),
  isFreeTrial: z.boolean().default(false),
  isFreeClient: z.boolean().default(false),
  freeTrialDays: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseInt(val);
    return num >= 1 && Number.isInteger(parseFloat(val));
  }, {
    message: "Free trial days must be a whole number (at least 1)",
  }),
  
  // Basic Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  countryCode: z.string().default("+1"),
  phone: z.string().min(1, "Phone number is required"),
  dob: z.string().optional(),
  
  // Package & Payment Information
  packageType: z.string().min(1, "Package type is required"),
  currency: z.string().default("USD"),
  financialAgreement: z.enum(["pif", "subscription", ""]),
  
  // PIF fields (conditional)
  pifPaymentType: z.enum(["full", "instalments", ""]).optional(),
  pifFullAmount: z.string()
    .optional()
    .refine((val) => !val || (parseFloat(val) >= 1), {
      message: "Amount must be greater than 0",
    }),
  pifMonths: z.string().optional(),
  monthlyRollingAmount: z.string()
    .optional()
    .refine((val) => !val || (parseFloat(val) >= 1), {
      message: "Amount must be greater than 0",
    }),
  numInstalments: z.number().min(1).max(5).optional(),
  instalments: z.array(z.object({
    date: z.string(),
    amount: z.string().refine((val) => !val || (parseFloat(val) >= 1), {
      message: "Amount must be greater than 0",
    }),
  })).optional(),
  
  // Subscription fields (conditional)
  subscriptionInterval: z.enum(["monthly", "weekly", ""]).optional(),
  subscriptionAmount: z.string()
    .optional()
    .refine((val) => !val || (parseFloat(val) >= 1), {
      message: "Amount must be greater than 0",
    }),
  firstPaymentType: z.enum(["deposit", "full", ""]).optional(),
  depositAmount: z.string()
    .optional()
    .refine((val) => !val || (parseFloat(val) >= 1), {
      message: "Amount must be greater than 0",
    }),
  remainderDate: z.string().optional(),
  
  minimumTerm: z.number().min(1, "Minimum term must be at least 1"),
  
  // Start Date & Coaching
  startDate: z.string().min(1, "Start date is required"),
  assignedCoach: z.string().min(1, "Assigned coach is required"),
  checkInDay: z.string().min(1, "Check-in day is required"),
  
  // Notes
  notes: z.string().optional(),
  
  // Closer
  closerId: z.string().min(1, "Closer is required"),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface AddClientFormProps {
  onSuccess: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AddClientForm = ({ onSuccess }: AddClientFormProps) => {
  const { toast } = useToast();
  const { user } = usePermissions();
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);

  // React Hook Form setup
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      generatePaymentLink: true,
      generateContract: true,
      isFreeTrial: false,
      isFreeClient: false,
      freeTrialDays: "",
      countryCode: "+1",
      currency: "USD",
      financialAgreement: "",
      pifPaymentType: "full",
      subscriptionInterval: "monthly",
      firstPaymentType: "full",
      startDate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      minimumTerm: 1,
      checkInDay: "Monday",
      numInstalments: 1,
      instalments: [],
      closerId: "",
    },
  });

  // Dynamic instalments array
  const { fields, replace } = useFieldArray({
    control,
    name: "instalments",
  });

  // Watch form values for conditional rendering
  const financialAgreement = watch("financialAgreement");
  const pifPaymentType = watch("pifPaymentType");
  const firstPaymentType = watch("firstPaymentType");
  const numInstalments = watch("numInstalments");
  const isFreeTrial = watch("isFreeTrial");
  const isFreeClient = watch("isFreeClient");

  // Fetch package types using React Query
  const { data: packageTypes } = useQuery({
    queryKey: ["packageTypes"],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // const { data, error } = await supabase.from("package_types").select("*").eq("is_active", true);
      // if (error) throw error;
      // return data;
      
      // Mock data for now
      return [
        { id: "1", name: "Premium Package", is_active: true },
        { id: "2", name: "Standard Package", is_active: true },
        { id: "3", name: "Basic Package", is_active: true },
      ];
    },
  });

  // Fetch coaches using React Query
  const { data: coachesData, isLoading: coachesLoading } = useQuery({
    queryKey: ["coaches"],
    queryFn: async () => {
      const response = await listEmployees({ role: "coach" });
      return response.results;
    },
  });
  
  const coaches = coachesData || [];

  // Fetch closers using React Query
  const { data: closersData, isLoading: closersLoading } = useQuery({
    queryKey: ["closers"],
    queryFn: async () => {
      const response = await listEmployees({ role: "closer", status: "active" });
      return response.results;
    },
  });

  // Fetch all active employees to find CEO and ensure logged-in user is included
  const { data: allEmployeesData } = useQuery({
    queryKey: ["allActiveEmployees"],
    queryFn: async () => {
      const response = await listEmployees({ status: "active" });
      return response.results;
    },
  });

  // Build the closers list with logic:
  // 1. Include all closers
  // 2. Always include logged-in user even if not a closer
  const closers = React.useMemo(() => {
    const closersList: Employee[] = closersData || [];
    const allEmployees = allEmployeesData || [];
    
    // Add logged-in user if not already in the list
    if (user && !closersList.find(c => c.id === user.id)) {
      const loggedInEmployee = allEmployees.find(e => e.id === user.id);
      if (loggedInEmployee) {
        closersList.push(loggedInEmployee);
      }
    }
    
    return closersList;
  }, [closersData, allEmployeesData, user]);

  // Determine default closer
  const defaultCloserId = React.useMemo(() => {
    if (!user || closers.length === 0) return undefined;
    
    // If logged-in user is a closer, default to them
    const userIsCloser = closers.find(c => c.id === user.id && c.role === "closer");
    if (userIsCloser) {
      return user.id.toString();
    }
    
    // Otherwise, find super_admin (CEO equivalent)
    const allEmployees = allEmployeesData || [];
    const superAdmin = allEmployees.find(e => e.role === "super_admin");
    if (superAdmin) {
      return superAdmin.id.toString();
    }
    
    // Fallback to first closer
    return closers[0]?.id.toString();
  }, [user, closers, allEmployeesData]);

  // Set default closer when data is loaded
  React.useEffect(() => {
    if (defaultCloserId && !watch("closerId")) {
      setValue("closerId", defaultCloserId);
    }
  }, [defaultCloserId, setValue, watch]);

  // Update instalments array when number changes
  useEffect(() => {
    if (pifPaymentType === "instalments" && numInstalments) {
      const newInstalments = Array.from({ length: numInstalments }, (_, i) => 
        fields[i] || { date: "", amount: "" }
      );
      replace(newInstalments);
    }
  }, [numInstalments, pifPaymentType, replace]);

  // Form submission handler
  const onSubmit = async (data: ClientFormData) => {
    try {
      // Get user data from localStorage
      const userDataString = localStorage.getItem("user");
      let userId = null;
      let accountId = null;

      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          userId = userData.id;
          accountId = userData.account_id;
        } catch (parseError) {
          console.error("Error parsing user data from localStorage:", parseError);
        }
      }

      // Generate a unique client ID (you can modify this logic as needed)
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Log the raw form data to debug
      console.log("[AddClientForm] Raw form data:", {
        assignedCoach: data.assignedCoach,
        assignedCoachType: typeof data.assignedCoach,
      });

      // Parse coach_id - ensure it's a valid number
      const coachId = data.assignedCoach ? parseInt(data.assignedCoach, 10) : undefined;
      
      if (!coachId || isNaN(coachId)) {
        console.error("[AddClientForm] Invalid coach ID:", data.assignedCoach);
        toast({
          title: "Error",
          description: "Please select a valid coach",
          variant: "destructive",
        });
        return;
      }

      // Map form data to backend API format
      const clientPayload: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: `${data.countryCode}${data.phone}`,
        date_of_birth: data.dob || null,
        country: "USA", // You can add a country field to the form if needed
        currency: data.currency,
        status: (data.isFreeTrial ? "pending" : "active") as "active" | "inactive" | "paused" | "pending",
        coach: coachId, // Backend expects 'coach' not 'coach_id' for creation
        // Add other fields as needed based on your backend API
        notes: data.notes || "",
      };

      // Prepare webhook payload with user and client IDs
      const webhookPayload = {
        userId,
        accountId,
        clientId,
        ...data,
        // Ensure boolean fields are sent as booleans, not strings
        isFreeClient: Boolean(data.isFreeClient),
        isFreeTrial: Boolean(data.isFreeTrial),
        sendPaymentLinkToClient: Boolean(data.sendPaymentLinkToClient),
        generateContract: Boolean(data.generateContract),
        // Include closer ID
        closerId: data.closerId,
      };

      console.log("[AddClientForm] Creating client with payload:", {
        ...clientPayload,
        coach: clientPayload.coach,
        coach_type: typeof clientPayload.coach,
      });
      console.log("[AddClientForm] Webhook payload:", webhookPayload);
      
      // 1. First, create client in database
      const newClient = await createClient(clientPayload);
      console.log("[AddClientForm] Client created successfully in database:", {
        id: newClient.id,
        coach_id: newClient.coach_id,
        coach_name: newClient.coach_name,
        fullResponse: newClient,
      });

      // 2. Then, send to webhook if configured
      const webhookUrl = process.env.NEXT_PUBLIC_ADD_CLIENT_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookPayload),
          });
          
          if (!response.ok) {
            console.warn("Webhook submission failed:", response.status);
          } else {
            console.log("Webhook sent successfully:", response.status);
          }
        } catch (webhookError) {
          console.warn("Webhook error:", webhookError);
          // Don't throw - continue with success message since client was created in DB
        }
      } else {
        console.log("Webhook not configured - skipping webhook");
      }

      toast({
        title: "Success!",
        description: "Client has been added successfully.",
      });

      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add client. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-h-[75vh] overflow-y-auto pr-2 pb-4">
      {/* ========================================================================
          OPTIONS
          ======================================================================== */}
      <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center space-x-2">
          <Controller
            name="generatePaymentLink"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="generatePaymentLink"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="generatePaymentLink" className="text-sm font-medium cursor-pointer">
            Generate payment link
          </Label>
        </div>

        {/* Nested checkbox - only shows when generatePaymentLink is checked */}
        {watch("generatePaymentLink") && (
          <div className="flex items-center space-x-2 ml-6 pl-4 border-l-2 border-primary/30">
            <Controller
              name="sendPaymentLinkToClient"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="sendPaymentLinkToClient"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="sendPaymentLinkToClient" className="text-sm font-medium cursor-pointer">
              Send payment link to client
            </Label>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Controller
            name="generateContract"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="generateContract"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="generateContract" className="text-sm font-medium cursor-pointer">
            Generate contract
          </Label>
        </div>
      </div>

      {/* ========================================================================
          BASIC INFORMATION
          ======================================================================== */}
      <div className="space-y-5 p-6 bg-card rounded-xl border border-border/50 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3">Basic Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              {...register("firstName")}
              className={errors.firstName ? "border-destructive" : ""}
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              {...register("lastName")}
              className={errors.lastName ? "border-destructive" : ""}
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Phone *</Label>
          <div className="flex gap-2">
            <Controller
              name="countryCode"
              control={control}
              render={({ field }) => {
                const selectedCountry = COUNTRY_CODES.find(c => c.dialCode === field.value);
                const popularCountries = getPopularCountries();
                const allCountries = getAllCountries();
                
                return (
                  <Popover open={countryCodeOpen} onOpenChange={setCountryCodeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={countryCodeOpen}
                        className="w-[180px] justify-between"
                      >
                        {selectedCountry ? (
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span>{selectedCountry.dialCode}</span>
                          </span>
                        ) : (
                          "Select country..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search country or code..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          
                          {/* Popular Countries */}
                          <CommandGroup heading="Popular">
                            {popularCountries.map((country) => (
                              <CommandItem
                                key={`${country.code}-${country.dialCode}`}
                                value={`${country.name} ${country.dialCode} ${country.code}`}
                                onSelect={() => {
                                  field.onChange(country.dialCode);
                                  setCountryCodeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === country.dialCode ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="text-lg mr-2">{country.flag}</span>
                                <span className="flex-1">{country.name}</span>
                                <span className="text-muted-foreground">{country.dialCode}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          
                          {/* All Countries */}
                          <CommandGroup heading="All Countries">
                            {allCountries.map((country) => (
                              <CommandItem
                                key={`${country.code}-${country.dialCode}`}
                                value={`${country.name} ${country.dialCode} ${country.code}`}
                                onSelect={() => {
                                  field.onChange(country.dialCode);
                                  setCountryCodeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === country.dialCode ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="text-lg mr-2">{country.flag}</span>
                                <span className="flex-1">{country.name}</span>
                                <span className="text-muted-foreground">{country.dialCode}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                );
              }}
            />
            <Input
              {...register("phone")}
              placeholder="555-0123"
              className={errors.phone ? "border-destructive" : ""}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth (DD/MM/YYYY)</Label>
          <Input
            id="dob"
            type="text"
            placeholder="DD/MM/YYYY"
            {...register("dob")}
          />
        </div>
      </div>

      {/* ========================================================================
          PACKAGE & PAYMENT INFORMATION
          ======================================================================== */}
      <div className="space-y-5 p-6 bg-card rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-lg font-semibold text-foreground">Package & Payment Information</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Controller
                name="isFreeClient"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isFreeClient"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isFreeClient" className="text-sm font-medium cursor-pointer">
                Free Client
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="isFreeTrial"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isFreeTrial"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isFreeTrial" className="text-sm font-medium cursor-pointer">
                Free Trial
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="packageType">Product Name *</Label>
          <Controller
            name="packageType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
                <SelectContent>
                  {packageTypes?.filter((pkg) => pkg.is_active !== false).map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.name}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.packageType && (
            <p className="text-xs text-destructive">{errors.packageType.message}</p>
          )}
        </div>

        {isFreeTrial && (
          <div className="space-y-2">
            <Label htmlFor="freeTrialDays">Free Trial Duration (days) *</Label>
            <Input
              id="freeTrialDays"
              type="number"
              min="1"
              step="1"
              placeholder="e.g., 7, 14, 30"
              {...register("freeTrialDays")}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, '');
              }}
              onWheel={(e) => e.currentTarget.blur()}
              className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.freeTrialDays ? "border-destructive" : ""}`}
            />
            {errors.freeTrialDays && (
              <p className="text-xs text-destructive">{errors.freeTrialDays.message}</p>
            )}
          </div>
        )}

        {!isFreeClient && (
          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}
        
        {!isFreeClient && (
          <>
            <div className="space-y-2">
              <Label htmlFor="financialAgreement">Financial Agreement *</Label>
              <Controller
                name="financialAgreement"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agreement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pif">Paid in Full (PIF)</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.financialAgreement && (
                <p className="text-xs text-destructive">{errors.financialAgreement.message}</p>
              )}
            </div>

            {/* PIF Options */}
            {financialAgreement === "pif" && (
          <div className="space-y-5 pl-6 pr-4 py-4 border-l-4 border-primary/50 bg-primary/5 rounded-r-lg">
            <div className="space-y-2">
              <Label>Payment Options *</Label>
              <Controller
                name="pifPaymentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Options" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Amount Today</SelectItem>
                      <SelectItem value="instalments">Instalments</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {pifPaymentType === "full" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pifFullAmount">Full Amount *</Label>
                  <Input
                    id="pifFullAmount"
                    type="number"
                    step="0.01"
                    min="1"
                    {...register("pifFullAmount")}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.pifFullAmount ? "border-destructive" : ""}`}
                  />
                  {errors.pifFullAmount && (
                    <p className="text-xs text-destructive">{errors.pifFullAmount.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pifMonths">Number of PIF Months *</Label>
                  <Input
                    id="pifMonths"
                    type="number"
                    min="1"
                    {...register("pifMonths")}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyRollingAmount">Monthly Rolling Amount After PIF *</Label>
                  <Input
                    id="monthlyRollingAmount"
                    type="number"
                    step="0.01"
                    min="1"
                    {...register("monthlyRollingAmount")}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.monthlyRollingAmount ? "border-destructive" : ""}`}
                  />
                  {errors.monthlyRollingAmount && (
                    <p className="text-xs text-destructive">{errors.monthlyRollingAmount.message}</p>
                  )}
                </div>
              </>
            )}

            {pifPaymentType === "instalments" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="numInstalments">Number of Instalments (up to 5) *</Label>
                  <Input
                    id="numInstalments"
                    type="number"
                    min="1"
                    max="5"
                    step="1"
                    {...register("numInstalments", { valueAsNumber: true })}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/[^0-9]/g, '');
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-3 p-5 bg-muted/50 rounded-lg border border-border/30">
                    <h4 className="font-semibold text-sm text-muted-foreground">Instalment {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          {...register(`instalments.${index}.date`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="1"
                          {...register(`instalments.${index}.amount`)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.instalments?.[index]?.amount ? "border-destructive" : ""}`}
                        />
                        {errors.instalments?.[index]?.amount && (
                          <p className="text-xs text-destructive">
                            {errors.instalments[index].amount.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Subscription Options */}
        {financialAgreement === "subscription" && (
          <div className="space-y-5 pl-6 pr-4 py-4 border-l-4 border-primary/50 bg-primary/5 rounded-r-lg">
            <div className="space-y-2">
              <Label htmlFor="subscriptionInterval">Subscription Interval *</Label>
              <Controller
                name="subscriptionInterval"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionAmount">Subscription Amount *</Label>
              <Input
                id="subscriptionAmount"
                type="number"
                step="0.01"
                min="1"
                placeholder="Enter subscription amount"
                {...register("subscriptionAmount")}
                onWheel={(e) => e.currentTarget.blur()}
                className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.subscriptionAmount ? "border-destructive" : ""}`}
              />
              {errors.subscriptionAmount && (
                <p className="text-xs text-destructive">{errors.subscriptionAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>First Payment *</Label>
              <Controller
                name="firstPaymentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select first payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full First Amount Now</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {firstPaymentType === "deposit" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount *</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    min="1"
                    {...register("depositAmount")}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.depositAmount ? "border-destructive" : ""}`}
                  />
                  {errors.depositAmount && (
                    <p className="text-xs text-destructive">{errors.depositAmount.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remainderDate">Remainder Payment Date *</Label>
                  <Input
                    id="remainderDate"
                    type="date"
                    {...register("remainderDate")}
                  />
                </div>
              </>
            )}
          </div>
        )}

            <div className="space-y-2">
              <Label htmlFor="minimumTerm">Minimum Term (in months) *</Label>
              <Input
                id="minimumTerm"
                type="number"
                min="1"
                step="1"
                {...register("minimumTerm", { valueAsNumber: true })}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.value = target.value.replace(/[^0-9]/g, '');
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.minimumTerm ? "border-destructive" : ""}`}
              />
              {errors.minimumTerm && (
                <p className="text-xs text-destructive">{errors.minimumTerm.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================
          START DATE & COACHING
          ======================================================================== */}
      <div className="space-y-5 p-6 bg-card rounded-xl border border-border/50 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3">Start Date & Coaching</h3>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            type="date"
            {...register("startDate")}
            className={errors.startDate ? "border-destructive" : ""}
          />
          {errors.startDate && (
            <p className="text-xs text-destructive">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedCoach">Assigned Coach *</Label>
          <Controller
            name="assignedCoach"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={coachesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={coachesLoading ? "Loading coaches..." : "Select coach"} />
                </SelectTrigger>
                <SelectContent>
                  {coaches.length === 0 && !coachesLoading ? (
                    <SelectItem value="no-coaches" disabled>No coaches available</SelectItem>
                  ) : (
                    coaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id.toString()}>
                        {coach.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.assignedCoach && (
            <p className="text-xs text-destructive">{errors.assignedCoach.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkInDay">Client's Check-in Day *</Label>
          <Controller
            name="checkInDay"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.checkInDay && (
            <p className="text-xs text-destructive">{errors.checkInDay.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="closerId">Closer *</Label>
          <Controller
            name="closerId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={closersLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={closersLoading ? "Loading closers..." : "Select closer"} />
                </SelectTrigger>
                <SelectContent>
                  {closers.length === 0 && !closersLoading ? (
                    <SelectItem value="no-closers" disabled>No closers available</SelectItem>
                  ) : (
                    closers.map((closer) => (
                      <SelectItem key={closer.id} value={closer.id.toString()}>
                        {closer.name}
                        {closer.id === user?.id && closer.role !== "closer" && (
                          <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.closerId && (
            <p className="text-xs text-destructive">{errors.closerId.message}</p>
          )}
        </div>
      </div>

      {/* ========================================================================
          NOTES
          ======================================================================== */}
      <div className="space-y-5 p-6 bg-card rounded-xl border border-border/50 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-3">Additional Notes</h3>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            rows={4}
            placeholder="Add any additional notes about the client..."
            className="resize-none"
          />
        </div>
      </div>

      {/* ========================================================================
          SUBMIT BUTTON
          ======================================================================== */}
      <div className="flex justify-end gap-4 pt-6 border-t border-border/50">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[150px] shadow-lg hover:shadow-xl transition-all"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Client...
            </>
          ) : (
            "Add Client"
          )}
        </Button>
      </div>
    </form>
  );
};
