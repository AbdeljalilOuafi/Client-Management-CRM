"use client";

import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { LAYOUT_TYPE } from "@/lib/layout-config";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
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

  // New design: Claude-style sidebar
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-16 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}
