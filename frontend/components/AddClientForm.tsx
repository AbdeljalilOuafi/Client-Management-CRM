import { useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

const clientFormSchema = z.object({
  // Options
  generatePaymentLink: z.boolean().default(true),
  generateContract: z.boolean().default(true),
  
  // Basic Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  countryCode: z.string().default("+1"),
  phone: z.string().min(1, "Phone number is required"),
  dob: z.string().min(1, "Date of birth is required"),
  
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
  firstPaymentType: z.enum(["deposit", "full", ""]).optional(),
  depositAmount: z.string()
    .optional()
    .refine((val) => !val || (parseFloat(val) >= 1), {
      message: "Amount must be greater than 0",
    }),
  remainderDate: z.string().optional(),
  
  minimumTerm: z.string().min(1, "Minimum term is required"),
  
  // Start Date & Coaching
  startingToday: z.enum(["yes", "no", ""]),
  startDate: z.string().optional(),
  assignedCoach: z.string().min(1, "Assigned coach is required"),
  checkInDay: z.string().min(1, "Check-in day is required"),
  
  // Notes
  notes: z.string().optional(),
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
      countryCode: "+1",
      currency: "USD",
      financialAgreement: "",
      pifPaymentType: "",
      subscriptionInterval: "",
      firstPaymentType: "",
      startingToday: "",
      numInstalments: 1,
      instalments: [],
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
  const startingToday = watch("startingToday");
  const numInstalments = watch("numInstalments");

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
        { id: "1", name: "Premium Package" },
        { id: "2", name: "Standard Package" },
        { id: "3", name: "Basic Package" },
      ];
    },
  });

  // Fetch coaches using React Query
  const { data: coaches } = useQuery({
    queryKey: ["coaches"],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // const { data, error } = await supabase.from("employees").select("*").eq("role", "coach").eq("is_active", true);
      // if (error) throw error;
      // return data;
      
      // Mock data for now
      return [
        { id: "1", name: "Coach John" },
        { id: "2", name: "Coach Sarah" },
        { id: "3", name: "Coach Mike" },
      ];
    },
  });

  // Update instalments array when number changes
  useEffect(() => {
    if (pifPaymentType === "instalments" && numInstalments) {
      const newInstalments = Array.from({ length: numInstalments }, (_, i) => 
        fields[i] || { date: "", amount: "" }
      );
      replace(newInstalments);
    }
  }, [numInstalments, pifPaymentType, fields, replace]);

  // Form submission handler
  const onSubmit = async (data: ClientFormData) => {
    try {
      // TODO: Replace with actual webhook URL when available
      const webhookUrl = "YOUR_N8N_WEBHOOK_URL_HERE";
      
      console.log("Form Data:", data);
      
      // Simulated API call
      // const response = await fetch(webhookUrl, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(data),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to submit form");
      // }

      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Success!",
        description: "Client has been added successfully.",
      });

      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
      {/* ========================================================================
          OPTIONS
          ======================================================================== */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

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
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+1">+1 (US)</SelectItem>
                    <SelectItem value="+44">+44 (UK)</SelectItem>
                    <SelectItem value="+971">+971 (UAE)</SelectItem>
                    <SelectItem value="+61">+61 (AU)</SelectItem>
                  </SelectContent>
                </Select>
              )}
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
          <Label htmlFor="dob">Date of Birth (DD/MM/YYYY) *</Label>
          <Input
            id="dob"
            type="text"
            placeholder="DD/MM/YYYY"
            {...register("dob")}
            className={errors.dob ? "border-destructive" : ""}
          />
          {errors.dob && (
            <p className="text-xs text-destructive">{errors.dob.message}</p>
          )}
        </div>
      </div>

      {/* ========================================================================
          PACKAGE & PAYMENT INFORMATION
          ======================================================================== */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Package & Payment Information</h3>

        <div className="space-y-2">
          <Label htmlFor="packageType">Type of Client *</Label>
          <Controller
            name="packageType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
                <SelectContent>
                  {packageTypes?.map((pkg) => (
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
          <div className="space-y-4 pl-4 border-l-2 border-primary">
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Controller
                name="pifPaymentType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
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
                    className={errors.pifFullAmount ? "border-destructive" : ""}
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
                    className={errors.monthlyRollingAmount ? "border-destructive" : ""}
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
                    {...register("numInstalments", { valueAsNumber: true })}
                  />
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-2 p-4 bg-muted rounded-md">
                    <h4 className="font-medium">Instalment {index + 1}</h4>
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
                          className={errors.instalments?.[index]?.amount ? "border-destructive" : ""}
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
          <div className="space-y-4 pl-4 border-l-2 border-primary">
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
                    className={errors.depositAmount ? "border-destructive" : ""}
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
            {...register("minimumTerm")}
            className={errors.minimumTerm ? "border-destructive" : ""}
          />
          {errors.minimumTerm && (
            <p className="text-xs text-destructive">{errors.minimumTerm.message}</p>
          )}
        </div>
      </div>

      {/* ========================================================================
          START DATE & COACHING
          ======================================================================== */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Start Date & Coaching</h3>

        <div className="space-y-2">
          <Label>Are they starting today? *</Label>
          <Controller
            name="startingToday"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.startingToday && (
            <p className="text-xs text-destructive">{errors.startingToday.message}</p>
          )}
        </div>

        {startingToday === "no" && (
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              {...register("startDate")}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="assignedCoach">Assigned Coach *</Label>
          <Controller
            name="assignedCoach"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coach" />
                </SelectTrigger>
                <SelectContent>
                  {coaches?.map((coach) => (
                    <SelectItem key={coach.id} value={coach.name}>
                      {coach.name}
                    </SelectItem>
                  ))}
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
      </div>

      {/* ========================================================================
          ADDITIONAL NOTES
          ======================================================================== */}
      <div className="space-y-2">
        <Label htmlFor="notes">Extra Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Add any additional notes here..."
          rows={4}
        />
      </div>

      {/* ========================================================================
          SUBMIT BUTTON
          ======================================================================== */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting}>
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
