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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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

import { useSidebar } from "@/contexts/SidebarContext";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isExpanded, toggleSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({}); // Track which parent menus are expanded
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

  // Separate parent pages from child pages
  const parentPages = navPages.filter(page => !page.parentId);
  const childPages = navPages.filter(page => page.parentId);

  // Group children by parent
  const childrenByParent = childPages.reduce((acc, page) => {
    if (!acc[page.parentId!]) {
      acc[page.parentId!] = [];
    }
    acc[page.parentId!].push(page);
    return acc;
  }, {} as Record<string, typeof navPages>);

  const isActive = (path: string) => pathname === path;

  // Check if any child of a parent is active
  const isParentActive = (parentId: string) => {
    const children = childrenByParent[parentId] || [];
    return children.some(child => isActive(child.path));
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  return (
    <>
      {/* Sidebar - Always visible, width changes based on expanded state */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border z-50 transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-16"
        )}
      >
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="relative h-16 border-b border-border">
          <div className="flex items-center h-full px-4">
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
                FitHQ
              </span>
            </div>
          </div>
          
          {/* Floating Toggle Button - On right edge */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="absolute top-1/2 -translate-y-1/2 -right-3 h-7 w-7 rounded-full bg-background shadow-md border-border hover:bg-accent transition-all z-10"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          ) : (
          <div className="space-y-1 px-2">
            {parentPages.map((page) => {
              const Icon = getIconComponent(page.icon);
              const hasChildren = childrenByParent[page.id]?.length > 0;
              const active = isActive(page.path);
              const childActive = isParentActive(page.id);
              const isMenuExpanded = expandedMenus[page.id];

              // Parent menu item (with or without children)
              const navButton = (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 transition-all duration-200",
                    (active || childActive)
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    !isExpanded && "justify-center px-2"
                  )}
                  onClick={() => {
                    if (hasChildren) {
                      toggleMenu(page.id);
                      // Auto-expand sidebar if clicking parent menu while collapsed
                      if (!isExpanded) {
                        toggleSidebar();
                      }
                    } else {
                      router.push(page.path);
                    }
                  }}
                  aria-label={page.name}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={cn(
                      "flex-1 text-left transition-opacity duration-200 whitespace-nowrap",
                      isExpanded ? "opacity-100" : "opacity-0 w-0"
                    )}
                  >
                    {page.name}
                  </span>
                  {hasChildren && isExpanded && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isMenuExpanded && "rotate-180"
                      )}
                    />
                  )}
                  {(active || childActive) && !isExpanded && (
                    <div className="absolute left-0 w-1 h-8 bg-primary rounded-r" />
                  )}
                </Button>
              );

              const parentItem = !isExpanded ? (
                <Tooltip key={page.id} delayDuration={0}>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    {page.name}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div key={page.id}>{navButton}</div>
              );

              // Render children if parent is expanded
              const childItems = hasChildren && isExpanded && isMenuExpanded ? (
                <div className="ml-4 space-y-1 mt-1">
                  {childrenByParent[page.id].map((child) => {
                    const ChildIcon = getIconComponent(child.icon);
                    const childIsActive = isActive(child.path);

                    return (
                      <Button
                        key={child.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 transition-all duration-200 text-sm",
                          childIsActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                        onClick={() => router.push(child.path)}
                        aria-label={child.name}
                      >
                        <ChildIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{child.name}</span>
                      </Button>
                    );
                  })}
                </div>
              ) : null;

              return (
                <div key={page.id}>
                  {parentItem}
                  {childItems}
                </div>
              );
            })}
          </div>
          )}
        </nav>

        {/* Footer Section */}
        <div className="border-t border-border p-2 space-y-1">
          {/* Theme Toggle */}
          {!isExpanded ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                Toggle theme
              </TooltipContent>
            </Tooltip>
          ) : (
            <ThemeToggle showLabel />
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
    </aside>
    </>
  );
}
