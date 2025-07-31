import * as React from "react";
import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";

export function NavSecondary() {
  return (
    <SidebarGroup >
      <SidebarGroupContent>
        <SidebarMenu>
          <ThemeToggle />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
