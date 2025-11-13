"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { logout, getStoredUser } from "@/lib/api/auth";
import { useToast } from "@/hooks/use-toast";

export function UserProfileMenu() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const user = getStoredUser();
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Failed to logout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    // Navigate to profile page (placeholder for now)
    router.push("/profile");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:opacity-80 transition-opacity"
        >
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            {userInitials}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleProfileClick}
          className="cursor-pointer hover:bg-muted transition-colors"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
