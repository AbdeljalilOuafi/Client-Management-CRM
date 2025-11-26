"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_STORAGE_KEY = "sidebar-expanded-state";

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage, default to true (open)
  const [isExpanded, setIsExpandedState] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    }
    return true;
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isExpanded));
    }
  }, [isExpanded]);

  const setIsExpanded = (expanded: boolean) => {
    setIsExpandedState(expanded);
  };

  const toggleSidebar = () => {
    setIsExpandedState((prev: boolean) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
