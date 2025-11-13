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
import { listEmployees } from "@/lib/api/staff";

// ============================================================================
// COUNTRY CODES DATA
// ============================================================================

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", name: "United States/Canada" },
  { code: "+7", country: "RU", name: "Russia" },
  { code: "+20", country: "EG", name: "Egypt" },
  { code: "+27", country: "ZA", name: "South Africa" },
  { code: "+30", country: "GR", name: "Greece" },
  { code: "+31", country: "NL", name: "Netherlands" },
  { code: "+32", country: "BE", name: "Belgium" },
  { code: "+33", country: "FR", name: "France" },
  { code: "+34", country: "ES", name: "Spain" },
  { code: "+36", country: "HU", name: "Hungary" },
  { code: "+39", country: "IT", name: "Italy" },
  { code: "+40", country: "RO", name: "Romania" },
  { code: "+41", country: "CH", name: "Switzerland" },
  { code: "+43", country: "AT", name: "Austria" },
  { code: "+44", country: "GB", name: "United Kingdom" },
  { code: "+45", country: "DK", name: "Denmark" },
  { code: "+46", country: "SE", name: "Sweden" },
  { code: "+47", country: "NO", name: "Norway" },
  { code: "+48", country: "PL", name: "Poland" },
  { code: "+49", country: "DE", name: "Germany" },
  { code: "+51", country: "PE", name: "Peru" },
  { code: "+52", country: "MX", name: "Mexico" },
  { code: "+53", country: "CU", name: "Cuba" },
  { code: "+54", country: "AR", name: "Argentina" },
  { code: "+55", country: "BR", name: "Brazil" },
  { code: "+56", country: "CL", name: "Chile" },
  { code: "+57", country: "CO", name: "Colombia" },
  { code: "+58", country: "VE", name: "Venezuela" },
  { code: "+60", country: "MY", name: "Malaysia" },
  { code: "+61", country: "AU", name: "Australia" },
  { code: "+62", country: "ID", name: "Indonesia" },
  { code: "+63", country: "PH", name: "Philippines" },
  { code: "+64", country: "NZ", name: "New Zealand" },
  { code: "+65", country: "SG", name: "Singapore" },
  { code: "+66", country: "TH", name: "Thailand" },
  { code: "+81", country: "JP", name: "Japan" },
  { code: "+82", country: "KR", name: "South Korea" },
  { code: "+84", country: "VN", name: "Vietnam" },
  { code: "+86", country: "CN", name: "China" },
  { code: "+90", country: "TR", name: "Turkey" },
  { code: "+91", country: "IN", name: "India" },
  { code: "+92", country: "PK", name: "Pakistan" },
  { code: "+93", country: "AF", name: "Afghanistan" },
  { code: "+94", country: "LK", name: "Sri Lanka" },
  { code: "+95", country: "MM", name: "Myanmar" },
  { code: "+98", country: "IR", name: "Iran" },
  { code: "+212", country: "MA", name: "Morocco" },
  { code: "+213", country: "DZ", name: "Algeria" },
  { code: "+216", country: "TN", name: "Tunisia" },
  { code: "+218", country: "LY", name: "Libya" },
  { code: "+220", country: "GM", name: "Gambia" },
  { code: "+221", country: "SN", name: "Senegal" },
  { code: "+222", country: "MR", name: "Mauritania" },
  { code: "+223", country: "ML", name: "Mali" },
  { code: "+224", country: "GN", name: "Guinea" },
  { code: "+225", country: "CI", name: "Ivory Coast" },
  { code: "+226", country: "BF", name: "Burkina Faso" },
  { code: "+227", country: "NE", name: "Niger" },
  { code: "+228", country: "TG", name: "Togo" },
  { code: "+229", country: "BJ", name: "Benin" },
  { code: "+230", country: "MU", name: "Mauritius" },
  { code: "+231", country: "LR", name: "Liberia" },
  { code: "+232", country: "SL", name: "Sierra Leone" },
  { code: "+233", country: "GH", name: "Ghana" },
  { code: "+234", country: "NG", name: "Nigeria" },
  { code: "+235", country: "TD", name: "Chad" },
  { code: "+236", country: "CF", name: "Central African Republic" },
  { code: "+237", country: "CM", name: "Cameroon" },
  { code: "+238", country: "CV", name: "Cape Verde" },
  { code: "+239", country: "ST", name: "São Tomé and Príncipe" },
  { code: "+240", country: "GQ", name: "Equatorial Guinea" },
  { code: "+241", country: "GA", name: "Gabon" },
  { code: "+242", country: "CG", name: "Republic of the Congo" },
  { code: "+243", country: "CD", name: "Democratic Republic of the Congo" },
  { code: "+244", country: "AO", name: "Angola" },
  { code: "+245", country: "GW", name: "Guinea-Bissau" },
  { code: "+246", country: "IO", name: "British Indian Ocean Territory" },
  { code: "+248", country: "SC", name: "Seychelles" },
  { code: "+249", country: "SD", name: "Sudan" },
  { code: "+250", country: "RW", name: "Rwanda" },
  { code: "+251", country: "ET", name: "Ethiopia" },
  { code: "+252", country: "SO", name: "Somalia" },
  { code: "+253", country: "DJ", name: "Djibouti" },
  { code: "+254", country: "KE", name: "Kenya" },
  { code: "+255", country: "TZ", name: "Tanzania" },
  { code: "+256", country: "UG", name: "Uganda" },
  { code: "+257", country: "BI", name: "Burundi" },
  { code: "+258", country: "MZ", name: "Mozambique" },
  { code: "+260", country: "ZM", name: "Zambia" },
  { code: "+261", country: "MG", name: "Madagascar" },
  { code: "+262", country: "RE", name: "Réunion" },
  { code: "+263", country: "ZW", name: "Zimbabwe" },
  { code: "+264", country: "NA", name: "Namibia" },
  { code: "+265", country: "MW", name: "Malawi" },
  { code: "+266", country: "LS", name: "Lesotho" },
  { code: "+267", country: "BW", name: "Botswana" },
  { code: "+268", country: "SZ", name: "Eswatini" },
  { code: "+269", country: "KM", name: "Comoros" },
  { code: "+290", country: "SH", name: "Saint Helena" },
  { code: "+291", country: "ER", name: "Eritrea" },
  { code: "+297", country: "AW", name: "Aruba" },
  { code: "+298", country: "FO", name: "Faroe Islands" },
  { code: "+299", country: "GL", name: "Greenland" },
  { code: "+350", country: "GI", name: "Gibraltar" },
  { code: "+351", country: "PT", name: "Portugal" },
  { code: "+352", country: "LU", name: "Luxembourg" },
  { code: "+353", country: "IE", name: "Ireland" },
  { code: "+354", country: "IS", name: "Iceland" },
  { code: "+355", country: "AL", name: "Albania" },
  { code: "+356", country: "MT", name: "Malta" },
  { code: "+357", country: "CY", name: "Cyprus" },
  { code: "+358", country: "FI", name: "Finland" },
  { code: "+359", country: "BG", name: "Bulgaria" },
  { code: "+370", country: "LT", name: "Lithuania" },
  { code: "+371", country: "LV", name: "Latvia" },
  { code: "+372", country: "EE", name: "Estonia" },
  { code: "+373", country: "MD", name: "Moldova" },
  { code: "+374", country: "AM", name: "Armenia" },
  { code: "+375", country: "BY", name: "Belarus" },
  { code: "+376", country: "AD", name: "Andorra" },
  { code: "+377", country: "MC", name: "Monaco" },
  { code: "+378", country: "SM", name: "San Marino" },
  { code: "+380", country: "UA", name: "Ukraine" },
  { code: "+381", country: "RS", name: "Serbia" },
  { code: "+382", country: "ME", name: "Montenegro" },
  { code: "+383", country: "XK", name: "Kosovo" },
  { code: "+385", country: "HR", name: "Croatia" },
  { code: "+386", country: "SI", name: "Slovenia" },
  { code: "+387", country: "BA", name: "Bosnia and Herzegovina" },
  { code: "+389", country: "MK", name: "North Macedonia" },
  { code: "+420", country: "CZ", name: "Czech Republic" },
  { code: "+421", country: "SK", name: "Slovakia" },
  { code: "+423", country: "LI", name: "Liechtenstein" },
  { code: "+500", country: "FK", name: "Falkland Islands" },
  { code: "+501", country: "BZ", name: "Belize" },
  { code: "+502", country: "GT", name: "Guatemala" },
  { code: "+503", country: "SV", name: "El Salvador" },
  { code: "+504", country: "HN", name: "Honduras" },
  { code: "+505", country: "NI", name: "Nicaragua" },
  { code: "+506", country: "CR", name: "Costa Rica" },
  { code: "+507", country: "PA", name: "Panama" },
  { code: "+508", country: "PM", name: "Saint Pierre and Miquelon" },
  { code: "+509", country: "HT", name: "Haiti" },
  { code: "+590", country: "GP", name: "Guadeloupe" },
  { code: "+591", country: "BO", name: "Bolivia" },
  { code: "+592", country: "GY", name: "Guyana" },
  { code: "+593", country: "EC", name: "Ecuador" },
  { code: "+594", country: "GF", name: "French Guiana" },
  { code: "+595", country: "PY", name: "Paraguay" },
  { code: "+596", country: "MQ", name: "Martinique" },
  { code: "+597", country: "SR", name: "Suriname" },
  { code: "+598", country: "UY", name: "Uruguay" },
  { code: "+599", country: "CW", name: "Curaçao" },
  { code: "+670", country: "TL", name: "East Timor" },
  { code: "+672", country: "NF", name: "Norfolk Island" },
  { code: "+673", country: "BN", name: "Brunei" },
  { code: "+674", country: "NR", name: "Nauru" },
  { code: "+675", country: "PG", name: "Papua New Guinea" },
  { code: "+676", country: "TO", name: "Tonga" },
  { code: "+677", country: "SB", name: "Solomon Islands" },
  { code: "+678", country: "VU", name: "Vanuatu" },
  { code: "+679", country: "FJ", name: "Fiji" },
  { code: "+680", country: "PW", name: "Palau" },
  { code: "+681", country: "WF", name: "Wallis and Futuna" },
  { code: "+682", country: "CK", name: "Cook Islands" },
  { code: "+683", country: "NU", name: "Niue" },
  { code: "+685", country: "WS", name: "Samoa" },
  { code: "+686", country: "KI", name: "Kiribati" },
  { code: "+687", country: "NC", name: "New Caledonia" },
  { code: "+688", country: "TV", name: "Tuvalu" },
  { code: "+689", country: "PF", name: "French Polynesia" },
  { code: "+690", country: "TK", name: "Tokelau" },
  { code: "+691", country: "FM", name: "Micronesia" },
  { code: "+692", country: "MH", name: "Marshall Islands" },
  { code: "+850", country: "KP", name: "North Korea" },
  { code: "+852", country: "HK", name: "Hong Kong" },
  { code: "+853", country: "MO", name: "Macau" },
  { code: "+855", country: "KH", name: "Cambodia" },
  { code: "+856", country: "LA", name: "Laos" },
  { code: "+880", country: "BD", name: "Bangladesh" },
  { code: "+886", country: "TW", name: "Taiwan" },
  { code: "+960", country: "MV", name: "Maldives" },
  { code: "+961", country: "LB", name: "Lebanon" },
  { code: "+962", country: "JO", name: "Jordan" },
  { code: "+963", country: "SY", name: "Syria" },
  { code: "+964", country: "IQ", name: "Iraq" },
  { code: "+965", country: "KW", name: "Kuwait" },
  { code: "+966", country: "SA", name: "Saudi Arabia" },
  { code: "+967", country: "YE", name: "Yemen" },
  { code: "+968", country: "OM", name: "Oman" },
  { code: "+970", country: "PS", name: "Palestine" },
  { code: "+971", country: "AE", name: "United Arab Emirates" },
  { code: "+972", country: "IL", name: "Israel" },
  { code: "+973", country: "BH", name: "Bahrain" },
  { code: "+974", country: "QA", name: "Qatar" },
  { code: "+975", country: "BT", name: "Bhutan" },
  { code: "+976", country: "MN", name: "Mongolia" },
  { code: "+977", country: "NP", name: "Nepal" },
  { code: "+992", country: "TJ", name: "Tajikistan" },
  { code: "+993", country: "TM", name: "Turkmenistan" },
  { code: "+994", country: "AZ", name: "Azerbaijan" },
  { code: "+995", country: "GE", name: "Georgia" },
  { code: "+996", country: "KG", name: "Kyrgyzstan" },
  { code: "+998", country: "UZ", name: "Uzbekistan" },
];

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

const clientFormSchema = z.object({
  // Options
  generatePaymentLink: z.boolean().default(true),
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
  startingToday: z.enum(["yes", "no", ""]).default("no"),
  startDate: z.string().min(1, "Start date is required"),
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
      isFreeTrial: false,
      isFreeClient: false,
      freeTrialDays: "",
      countryCode: "+1",
      currency: "USD",
      financialAgreement: "",
      pifPaymentType: "full",
      subscriptionInterval: "monthly",
      firstPaymentType: "full",
      startingToday: "no",
      startDate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      minimumTerm: 1,
      checkInDay: "Monday",
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
        { id: "1", name: "Premium Package" },
        { id: "2", name: "Standard Package" },
        { id: "3", name: "Basic Package" },
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

      // Prepare payload with user and client IDs
      const payload = {
        userId,
        accountId,
        clientId,
        ...data,
      };

      // Webhook URL for new client form (from environment variable)
      const webhookUrl = process.env.NEXT_PUBLIC_ADD_CLIENT_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error("Webhook URL is not configured. Please set NEXT_PUBLIC_ADD_CLIENT_WEBHOOK_URL in .env.local");
      }
      
      console.log("Form Data:", payload);
      
      // Send data to webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      toast({
        title: "Success!",
        description: "Client has been added successfully.",
      });
      console.log("Response:", response.status);

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

        {isFreeTrial && (
          <div className="space-y-2 pl-6">
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
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {COUNTRY_CODES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.code} ({country.country})
                      </SelectItem>
                    ))}
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
                      <SelectItem key={coach.id} value={coach.name}>
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
