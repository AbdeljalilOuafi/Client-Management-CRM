"use client";

import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { LAYOUT_TYPE } from "@/lib/layout-config";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { isExpanded } = useSidebar();

  if (LAYOUT_TYPE === 'navbar') {
    // Old design: Top navigation bar
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    );
  }

  // New design: Sidebar pushes content (no overlay)
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main 
        className={cn(
          "flex-1 overflow-hidden bg-background transition-all duration-300 ease-in-out",
          isExpanded ? "ml-64" : "ml-16"
        )}
      >
        {children}
      </main>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
