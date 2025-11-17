"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Users,
  LayoutDashboard,
  CreditCard,
  DollarSign,
  FileText,
  Dumbbell,
} from "lucide-react";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [collapseTimeout, setCollapseTimeout] = useState<NodeJS.Timeout | null>(null);

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

  const handleMouseEnter = () => {
    if (collapseTimeout) {
      clearTimeout(collapseTimeout);
      setCollapseTimeout(null);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsExpanded(false);
    }, 150);
    setCollapseTimeout(timeout);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border z-50 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: "width" }}
    >
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <span
              className={cn(
                "font-bold text-lg whitespace-nowrap transition-opacity duration-200",
                isExpanded ? "opacity-100" : "opacity-0 w-0"
              )}
            >
              FitCoach Manager
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              const navButton = (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 transition-all duration-200",
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    !isExpanded && "justify-center px-2"
                  )}
                  onClick={() => router.push(item.path)}
                  aria-label={item.label}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={cn(
                      "transition-opacity duration-200 whitespace-nowrap",
                      isExpanded ? "opacity-100" : "opacity-0 w-0"
                    )}
                  >
                    {item.label}
                  </span>
                  {active && !isExpanded && (
                    <div className="absolute left-0 w-1 h-8 bg-primary rounded-r" />
                  )}
                </Button>
              );

              if (!isExpanded) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.path}>{navButton}</div>;
            })}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="border-t border-border p-2 space-y-1">
          {/* Theme Toggle */}
          <div
            className={cn(
              "flex items-center transition-all duration-200",
              !isExpanded && "justify-center"
            )}
          >
            {!isExpanded ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div>
                    <ThemeToggle />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  Toggle theme
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex items-center gap-3 w-full px-2">
                <ThemeToggle />
                <span className="text-sm text-muted-foreground transition-opacity duration-200">
                  Theme
                </span>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div
            className={cn(
              "flex items-center transition-all duration-200",
              !isExpanded && "justify-center"
            )}
          >
            <UserProfileMenu collapsed={!isExpanded} />
          </div>
        </div>
      </div>
    </aside>
  );
}
