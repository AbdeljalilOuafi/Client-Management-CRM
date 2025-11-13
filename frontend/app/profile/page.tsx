"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGuard } from "@/components/AuthGuard";
import { ArrowLeft, User, Mail, Briefcase, Building2 } from "lucide-react";
import { getStoredUser } from "@/lib/api/auth";
import { Navbar } from "@/components/Navbar";

export default function ProfilePage() {
  const router = useRouter();
  const user = getStoredUser();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-3xl font-bold">Profile</h2>
                <p className="text-muted-foreground">View and manage your account information</p>
              </div>
            </div>

            <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {user?.name
                        ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "U"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{user?.name || "User"}</h3>
                    <p className="text-sm text-muted-foreground">{user?.role || "Role"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Full Name</span>
                    </div>
                    <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                      {user?.name || "-"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 py-2 px-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                      {user?.email || "-"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>Role</span>
                    </div>
                    <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                      {user?.role || "-"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Account</span>
                    </div>
                    <p className="font-semibold text-foreground py-2 px-3 bg-muted/50 rounded-md">
                      {user?.account_name || "-"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  {/* <p className="text-sm text-muted-foreground text-center">
                    This is a placeholder profile page. Full profile editing functionality will be added when connected to the backend.
                  </p> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
