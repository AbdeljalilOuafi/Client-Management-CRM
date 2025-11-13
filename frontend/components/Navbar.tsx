"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, LayoutDashboard, CreditCard, DollarSign, FileText } from "lucide-react";
import { UserProfileMenu } from "@/components/UserProfileMenu";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      label: "Clients",
      icon: Users,
      path: "/clients",
    },
    {
      label: "Payments",
      icon: CreditCard,
      path: "/payments",
    },
    {
      label: "Instalments",
      icon: DollarSign,
      path: "/instalments",
    },
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      label: "Staff",
      icon: Users,
      path: "/staff",
    },
    {
      label: "Check-in Forms",
      icon: FileText,
      path: "/check-in-forms",
    },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold">FitCoach Manager</h1>
            <div className="flex gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className={`gap-2 ${
                      isActive(item.path) ? "border-b-2 border-primary" : ""
                    }`}
                    onClick={() => router.push(item.path)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
          <UserProfileMenu />
        </div>
      </div>
    </nav>
  );
}
