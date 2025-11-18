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
import { usePermissions } from "@/hooks/usePermissions";
import * as LucideIcons from "lucide-react";
import { DebugPermissions } from "@/components/DebugPermissions";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [collapseTimeout, setCollapseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { getNavigationPages, isLoading, user } = usePermissions();
  
  // Get navigation pages dynamically based on permissions
  const navPages = getNavigationPages();
  
  // Debug logging
  console.log('[Sidebar] Permissions state:', {
    isLoading,
    userRole: user?.role,
    navPagesCount: navPages.length,
    navPages: navPages.map(p => p.name),
  });

  // Helper to get icon component from string name
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Circle; // Fallback to Circle if icon not found
  };

  // Convert page permissions to nav items
  const navItems = navPages.map(page => ({
    label: page.name,
    icon: getIconComponent(page.icon),
    path: page.path,
  }));

  const isActive = (path: string) => pathname === path;

  const handleMouseEnter = () => {
    if (collapseTimeout) {
      clearTimeout(collapseTimeout);
      setCollapseTimeout(null);
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    // Don't collapse if dropdown is open
    if (isDropdownOpen) return;
    
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
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
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
          {!isExpanded ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <ThemeToggle 
                    onOpenChange={setIsDropdownOpen}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                Toggle theme
              </TooltipContent>
            </Tooltip>
          ) : (
            <ThemeToggle 
              onOpenChange={setIsDropdownOpen}
              showLabel
            />
          )}

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
      <DebugPermissions />
    </aside>
  );
}
