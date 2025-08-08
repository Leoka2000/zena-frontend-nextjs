import * as React from "react";
import { CopyPlus, type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function NavSecondary() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className=" mb-3">
          <Button className="mx-1" size="sm">
            <CopyPlus /> New device
          </Button>
        </SidebarMenu>
        <SidebarMenu>
          <ThemeToggle />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
