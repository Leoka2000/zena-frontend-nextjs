"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardContent from "../DashboardContent";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchForm } from "@/components/search-form";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login"); // redirect to login page
    }
  }, [router]);

  // You can optionally show a "loading" screen until redirect check is done
  if (!isAuthenticated()) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 justify-between shrink-0 items-center gap-2">
          <div>
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
          <div className="flex items-center mr-4 gap-2">
            <SearchForm />
            <ThemeToggle />
          </div>
        </header>

        <DashboardContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
