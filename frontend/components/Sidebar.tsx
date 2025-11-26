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
          "fixed left-0 top-0 h-screen bg-gradient-to-b from-card via-card to-card/95 border-r border-border/50 backdrop-blur-sm z-50 transition-all duration-300 ease-in-out shadow-xl",
          isExpanded ? "w-64" : "w-16"
        )}
      >
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="relative h-16 border-b border-border/50 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <div className="flex items-center h-full px-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                <Dumbbell className="h-6 w-6 text-primary relative z-10 drop-shadow-lg" />
              </div>
              <span
                className={cn(
                  "font-bold text-xl whitespace-nowrap transition-all duration-300 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent",
                  isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
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
            className="absolute top-1/2 -translate-y-1/2 -right-3 h-8 w-8 rounded-full bg-gradient-to-br from-background to-background/80 shadow-lg border-2 border-primary/20 hover:border-primary/40 hover:shadow-primary/20 hover:shadow-xl transition-all duration-300 hover:scale-110 z-10 group"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4 text-primary group-hover:text-primary transition-colors" />
            ) : (
              <ChevronRight className="h-4 w-4 text-primary group-hover:text-primary transition-colors" />
            )}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/30 transition-colors">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <div className="text-muted-foreground text-sm font-medium">Loading...</div>
              </div>
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
                    "w-full justify-start gap-3 transition-all duration-200 relative group overflow-hidden",
                    (active || childActive)
                      ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-primary font-semibold shadow-sm border-l-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-accent/50 hover:to-transparent",
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
                  {/* Hover effect background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0 relative z-10 transition-all duration-200",
                    (active || childActive) 
                      ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                      : "text-muted-foreground/70 group-hover:text-primary group-hover:scale-110 group-hover:drop-shadow-sm"
                  )} />
                  <span
                    className={cn(
                      "flex-1 text-left transition-all duration-300 whitespace-nowrap relative z-10",
                      isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 w-0"
                    )}
                  >
                    {page.name}
                  </span>
                  {hasChildren && isExpanded && (
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-all duration-300 relative z-10",
                        isMenuExpanded && "rotate-180",
                        (active || childActive) && "text-primary"
                      )}
                    />
                  )}
                  {(active || childActive) && !isExpanded && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" />
                  )}
                </Button>
              );

              const parentItem = !isExpanded ? (
                <Tooltip key={page.id} delayDuration={0}>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right" className="ml-2 bg-popover/95 backdrop-blur-sm border-primary/20 shadow-lg">
                    <span className="font-medium">{page.name}</span>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div key={page.id}>{navButton}</div>
              );

              // Render children if parent is expanded
              const childItems = hasChildren && isExpanded && isMenuExpanded ? (
                <div className="ml-4 space-y-1 mt-1 pl-2 border-l-2 border-border/30">
                  {childrenByParent[page.id].map((child, idx) => {
                    const ChildIcon = getIconComponent(child.icon);
                    const childIsActive = isActive(child.path);

                    return (
                      <Button
                        key={child.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 transition-all duration-200 text-sm relative group overflow-hidden",
                          childIsActive
                            ? "bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold border-l-2 border-primary/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-accent/30 hover:to-transparent",
                          // Stagger animation delay
                          `animate-in slide-in-from-left-2 fade-in duration-200`,
                        )}
                        style={{ animationDelay: `${idx * 50}ms` }}
                        onClick={() => router.push(child.path)}
                        aria-label={child.name}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <ChildIcon className={cn(
                          "h-4 w-4 flex-shrink-0 relative z-10 transition-all duration-200",
                          childIsActive 
                            ? "text-primary drop-shadow-sm" 
                            : "text-muted-foreground/60 group-hover:text-primary group-hover:scale-110"
                        )} />
                        <span className="whitespace-nowrap relative z-10">{child.name}</span>
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
        <div className="border-t border-border/50 p-2 space-y-2 bg-gradient-to-t from-primary/5 via-transparent to-transparent">
          {/* Theme Toggle */}
          {!isExpanded ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="p-1 rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-sm">
                    <ThemeToggle />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2 bg-popover/95 backdrop-blur-sm border-primary/20">
                Toggle theme
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="px-1">
              <ThemeToggle showLabel />
            </div>
          )}

          {/* User Profile */}
          <div
            className={cn(
              "flex items-center transition-all duration-200",
              !isExpanded && "justify-center"
            )}
          >
            <div className={cn(
              "w-full rounded-lg transition-all duration-200",
              isExpanded && "hover:bg-accent/30 p-1"
            )}>
              <UserProfileMenu collapsed={!isExpanded} />
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
