"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonitorCog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

interface Device {
  id: number;
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

export function CredentialsCard() {
  const [device, setDevice] = useState<Device | null>(null);
  const [form, setForm] = useState({
    name: "",
    serviceUuid: "",
    readNotifyCharacteristicUuid: "",
    writeCharacteristicUuid: "",
  });
  const [isOpen, setIsOpen] = useState(false);

  // Fetch active device on mount
  useEffect(() => {
    const fetchActiveDevice = async () => {
      try {
        const token = getToken();
        const res = await fetch("http://localhost:8080/api/device/active", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch active device");
        const activeDevice: Device = await res.json();
        setDevice(activeDevice);
        setForm({
          name: activeDevice.name,
          serviceUuid: activeDevice.serviceUuid,
          readNotifyCharacteristicUuid: activeDevice.readNotifyCharacteristicUuid,
          writeCharacteristicUuid: activeDevice.writeCharacteristicUuid,
        });
      } catch (err) {
        console.error(err);
        toast.error(
          err instanceof Error ? err.message : "Failed to fetch active device"
        );
      }
    };
    fetchActiveDevice();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) {
      toast.error("No active device available");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(
        `http://localhost:8080/api/device/list/${device.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) throw new Error("Failed to update device");
      const updatedDevice: Device = await res.json();
      setDevice(updatedDevice);
      setForm({
        name: updatedDevice.name,
        serviceUuid: updatedDevice.serviceUuid,
        readNotifyCharacteristicUuid: updatedDevice.readNotifyCharacteristicUuid,
        writeCharacteristicUuid: updatedDevice.writeCharacteristicUuid,
      });
      toast.success("Device updated successfully");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update device"
      );
    }
  };

  if (!device) return null; // Optionally show a loader

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="@container/card transition-transform duration-300 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
          <CardHeader>
            <CardDescription>Bluetooth Device</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              Credentials:
            </CardTitle>
            <CardAction>
              <span className="flex bg-neutral-50 shadow-md text-gray-500 text-xs font-medium me-2 px-2 py-1 rounded-lg dark:bg-neutral-800 dark:text-neutral-400 border dark:border-neutral-700">
                <MonitorCog size={25} strokeWidth={0.75} />
              </span>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex flex-col gap-1 font-mono">
              <div className="text-xs text-muted-foreground">
                <strong>Name:</strong> {device.name}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Service UUID:</strong> {device.serviceUuid}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Notify UUID:</strong> {device.readNotifyCharacteristicUuid}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Write UUID:</strong> {device.writeCharacteristicUuid}
              </div>
            </div>
          </CardFooter>
        </Card>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Bluetooth Credentials</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter device name"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceUuid">Service UUID</Label>
              <Input
                id="serviceUuid"
                name="serviceUuid"
                value={form.serviceUuid}
                onChange={handleChange}
                placeholder="Enter service UUID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="readNotifyCharacteristicUuid">
                Notify Characteristic UUID
              </Label>
              <Input
                id="readNotifyCharacteristicUuid"
                name="readNotifyCharacteristicUuid"
                value={form.readNotifyCharacteristicUuid}
                onChange={handleChange}
                placeholder="Enter notify characteristic UUID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="writeCharacteristicUuid">Write Characteristic UUID</Label>
              <Input
                id="writeCharacteristicUuid"
                name="writeCharacteristicUuid"
                value={form.writeCharacteristicUuid}
                onChange={handleChange}
                placeholder="Enter write characteristic UUID"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
