"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CopyPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LogoutButton } from "./LogoutButton";
import { AppUser } from "@/types/AppUser";
import { getToken, useAuthRedirect } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DeviceForm {
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

export function NavUser() {
  const { isMobile } = useSidebar();

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] = useState<DeviceForm>({
    name: "",
    serviceUuid: "",
    readNotifyCharacteristicUuid: "",
    writeCharacteristicUuid: "",
  });

  useAuthRedirect();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch("http://localhost:8080/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`);
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch user data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      toast.error("No auth token found");
      return;
    }
    try {
      const res = await fetch("http://localhost:8080/api/device/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create device");
      toast.success("Device created successfully");
      setIsDialogOpen(false);
      setForm({
        name: "",
        serviceUuid: "",
        readNotifyCharacteristicUuid: "",
        writeCharacteristicUuid: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create device");
    }
  };

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (error || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 p-2 text-sm text-red-500">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">!</AvatarFallback>
            </Avatar>
            <span>Error loading user</span>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.username}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.username}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <Link href="/account" legacyBehavior>
                <a>
                  <DropdownMenuItem>
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Account
                  </DropdownMenuItem>
                </a>
              </Link>

              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>

              {/* Create Device Button triggers Dialog */}
              <DropdownMenuItem asChild>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-0">
                        <CopyPlus className="mr-2 h-4 w-4" />
                        Create Device
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <DialogHeader>
                          <DialogTitle>Create New Device</DialogTitle>
                          <DialogDescription>
                            Fill in device details.
                          </DialogDescription>
                        </DialogHeader>

                        {[
                          "name",
                          "serviceUuid",
                          "readNotifyCharacteristicUuid",
                          "writeCharacteristicUuid",
                        ].map((field) => (
                          <div key={field} className="grid gap-3">
                            <Label htmlFor={field}>{field}</Label>
                            <Input
                              id={field}
                              name={field}
                              value={(form as any)[field]}
                              onChange={(e) =>
                                setForm({ ...form, [field]: e.target.value })
                              }
                              required
                            />
                          </div>
                        ))}

                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button type="submit">Create</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </>
                </Dialog>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
