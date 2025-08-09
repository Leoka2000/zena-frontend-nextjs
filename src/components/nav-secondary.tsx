"use client";

import * as React from "react";
import { CopyPlus } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";

interface DeviceForm {
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

type DeviceFormField = keyof DeviceForm;

export function NavSecondary() {
  const [form, setForm] = React.useState<DeviceForm>({
    name: "",
    serviceUuid: "",
    readNotifyCharacteristicUuid: "",
    writeCharacteristicUuid: "",
  });

  const [isOpen, setIsOpen] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast.error("No token found. Please login.");
      return;
    }
    try {
      const res = await fetch("http://localhost:8080/api/device/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = (errorData as { message?: string }).message || "Failed to create device";
        toast.error(message);
        return;
      }
      toast.success("Device created successfully");
      setIsOpen(false);
      setForm({
        name: "",
        serviceUuid: "",
        readNotifyCharacteristicUuid: "",
        writeCharacteristicUuid: "",
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Error creating device");
      } else {
        toast.error("Error creating device");
      }
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="mb-3">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="mx-1" size="sm">
                <CopyPlus /> New device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Create New Device</DialogTitle>
                  <DialogDescription>Fill in device details.</DialogDescription>
                </DialogHeader>
                {(
                  [
                    "name",
                    "serviceUuid",
                    "readNotifyCharacteristicUuid",
                    "writeCharacteristicUuid",
                  ] as DeviceFormField[]
                ).map((field) => (
                  <div key={field} className="grid gap-3">
                    <Label htmlFor={field}>{field}</Label>
                    <Input
                      id={field}
                      name={field}
                      required
                      value={form[field]}
                      onChange={(e) =>
                        setForm({ ...form, [field]: e.target.value })
                      }
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
          </Dialog>
        </SidebarMenu>
        <SidebarMenu>
          <ThemeToggle />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
