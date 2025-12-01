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
  title: "FitHQ - Client Management & Payment System",
  description: "Comprehensive client management, payment tracking, and instalment system for fitness professionals",
  metadataBase: new URL("https://app.fithq.ai"),
  icons: {
    icon: [
      { url: "/favicons/favicon.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon.svg", sizes: "any" },
    ],
    apple: "/favicons/favicon.svg",
  },
  openGraph: {
    title: "FitHQ",
    description: "Client Management & Payment System for Fitness Professionals",
    url: "https://app.fithq.ai",
    siteName: "FitHQ",
    type: "website",
    images: [
      {
        url: "/logos/fithq-logo.svg",
        width: 1200,
        height: 630,
        alt: "FitHQ Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitHQ",
    description: "Client Management & Payment System for Fitness Professionals",
    images: ["/logos/fithq-logo.svg"],
  },
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
