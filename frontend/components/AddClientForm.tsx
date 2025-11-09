import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/api/clients";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddClientFormProps {
  onSuccess: () => void;
}

export const AddClientForm = ({ onSuccess }: AddClientFormProps) => {
  const { toast } = useToast();
  
  // Form state - matching backend schema
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [address, setAddress] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [ghlId, setGhlId] = useState("");
  const [clientStartDate, setClientStartDate] = useState("");
  const [clientEndDate, setClientEndDate] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [gender, setGender] = useState("");
  const [leadOrigin, setLeadOrigin] = useState("");
  const [noticeGiven, setNoticeGiven] = useState(false);
  const [noMorePayments, setNoMorePayments] = useState(false);
  const [timezone, setTimezone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      await createClient({
        first_name: firstName,
        last_name: lastName || undefined,
        email,
        status,
        address: address || undefined,
        instagram_handle: instagramHandle || undefined,
        ghl_id: ghlId || undefined,
        client_start_date: clientStartDate || undefined,
        client_end_date: clientEndDate || undefined,
        dob: dob || undefined,
        country: country || undefined,
        state: state || undefined,
        currency: currency || undefined,
        gender: gender || undefined,
        lead_origin: leadOrigin || undefined,
        notice_given: noticeGiven,
        no_more_payments: noMorePayments,
        timezone: timezone || undefined,
      });

      setShowSuccess(true);
      
      toast({
        title: "Success!",
        description: "Client has been added successfully.",
      });

      // Wait for animation before closing
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add client";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <div className="rounded-full bg-green-100 p-6">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-2"
        >
          <h3 className="text-2xl font-bold">Client Added Successfully!</h3>
          <p className="text-muted-foreground">The client has been added to your database.</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6 max-h-[70vh] overflow-y-auto pr-4"
    >
      {/* Basic Information */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="flex items-center gap-2">
              First Name *
              {errors.firstName && <AlertCircle className="h-3 w-3 text-destructive" />}
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) {
                  setErrors(prev => ({ ...prev, firstName: "" }));
                }
              }}
              className={errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
              required
            />
            {errors.firstName && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {errors.firstName}
              </motion.p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            Email *
            {errors.email && <AlertCircle className="h-3 w-3 text-destructive" />}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: "" }));
              }
            }}
            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
            required
          />
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive"
            >
              {errors.email}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Input
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            />
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Client Dates */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Client Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientStartDate">Start Date</Label>
            <Input
              id="clientStartDate"
              type="date"
              value={clientStartDate}
              onChange={(e) => setClientStartDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientEndDate">End Date</Label>
            <Input
              id="clientEndDate"
              type="date"
              value={clientEndDate}
              onChange={(e) => setClientEndDate(e.target.value)}
            />
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagramHandle">Instagram Handle</Label>
            <Input
              id="instagramHandle"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              placeholder="@username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ghlId">GHL ID</Label>
            <Input
              id="ghlId"
              value={ghlId}
              onChange={(e) => setGhlId(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="AED">AED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/New_York"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="leadOrigin">Lead Origin</Label>
          <Input
            id="leadOrigin"
            value={leadOrigin}
            onChange={(e) => setLeadOrigin(e.target.value)}
          />
        </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-background pb-2">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="gap-2 min-w-[150px] shadow-sm hover:shadow-md transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding Client...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Add Client
            </>
          )}
        </Button>
      </div>
    </motion.form>
  );
};