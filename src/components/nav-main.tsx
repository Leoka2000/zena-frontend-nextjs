"use client";

import {
  Album,
  Bell,
  ChevronRight,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        <Link href="dashboard">
          <SidebarMenuItem>
            <SidebarMenuButton className="cursor-pointer">
              <LayoutDashboard />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>
        </Link>
        <SidebarMenuItem>
          <SidebarMenuButton className="cursor-pointer">
            <Album />
            Records
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton className="cursor-pointer">
            <Bell />
            Notifications
          </SidebarMenuButton>
        </SidebarMenuItem>
    
      </SidebarMenu>
    </SidebarGroup>
  );
}
