"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signup } from "@/lib/api/auth";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Account fields
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [timezone, setTimezone] = useState("");

  // User fields
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobRole, setJobRole] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        account: {
          name: accountName,
          email: accountEmail,
          ceo_name: ceoName,
          niche: niche || undefined,
          location: location || undefined,
          website_url: websiteUrl || undefined,
          timezone: timezone || undefined,
        },
        user: {
          name: userName,
          email: userEmail,
          password,
          phone_number: phoneNumber || undefined,
          job_role: jobRole || undefined,
        },
      });

      toast({
        title: "Success!",
        description: "Account created successfully. Redirecting...",
      });

      // Redirect to clients page after successful signup
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create account";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Set up your company account and admin user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Company Name *</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="My Fitness Company"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountEmail">Company Email *</Label>
                  <Input
                    id="accountEmail"
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="contact@company.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ceoName">CEO Name *</Label>
                  <Input
                    id="ceoName"
                    value={ceoName}
                    onChange={(e) => setCeoName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="niche">Niche</Label>
                  <Input
                    id="niche"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Fitness & Wellness"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Los Angeles, CA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://company.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="America/Los_Angeles"
                  />
                </div>
              </div>
            </div>

            {/* Admin User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Admin User Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Full Name *</Label>
                  <Input
                    id="userName"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email *</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="john@company.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobRole">Job Role</Label>
                  <Input
                    id="jobRole"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="CEO"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
