import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitHQ",
  description: "Payment and instalment management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PermissionsProvider>
            <QueryProvider>
              <TooltipProvider>
                {children}
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </QueryProvider>
          </PermissionsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
