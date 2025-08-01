"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Simple POST request without any headers or token
      await fetch("http://localhost:8080/auth/logout", {
        method: "POST",
        credentials: "include", // Only needed if using cookies
      });

      // Always clear client-side state and redirect
      logout();
      router.push("/");
      router.refresh(); // Clear any cached state
    } catch (error) {
      console.error("Logout error:", error);
      // Ensure we clean up even if the request fails
      logout();
      router.push("/");
    }
  };

  return (
    <a className="w-full" onClick={handleLogout}>
      <DropdownMenuItem  variant="destructive">
        <LogOut />
        Log out
      </DropdownMenuItem>
    </a>
  );
}
