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
import { Badge } from "@/components/ui/badge";
import { MonitorCog, WalletCards } from "lucide-react";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";
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

export function CredentialsCard() {
  const { selectedDevice, setSelectedDevice } = useBluetoothSensor();

  // Initialize form state from selectedDevice, or empty if none
  const [form, setForm] = useState({
    id: "",
    name: "",
    serviceUuid: "",
    readNotifyCharacteristicUuid: "",
    writeCharacteristicUuid: "",
  });

  // When selectedDevice changes, update form values accordingly
  useEffect(() => {
    if (selectedDevice) {
      setForm({
        id: selectedDevice.id ?? "",
        name: selectedDevice.name ?? "",
        serviceUuid: selectedDevice.serviceUuid ?? "",
        readNotifyCharacteristicUuid:
          selectedDevice.readNotifyCharacteristicUuid ?? "",
        writeCharacteristicUuid: selectedDevice.writeCharacteristicUuid ?? "",
      });
    } else {
      setForm({
        id: "",
        name: "",
        serviceUuid: "",
        readNotifyCharacteristicUuid: "",
        writeCharacteristicUuid: "",
      });
    }
  }, [selectedDevice]);

  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.id) {
    toast.error("No device selected to update.");
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(
      `http://localhost:8080/api/device/list/${form.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          serviceUuid: form.serviceUuid,
          readNotifyCharacteristicUuid: form.readNotifyCharacteristicUuid,
          writeCharacteristicUuid: form.writeCharacteristicUuid,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update device: ${response.statusText}`);
    }

    const updatedDevice = await response.json();

    // Update context with new device data
    setSelectedDevice(updatedDevice);

    toast.success("Device updated successfully");
    setIsOpen(false);
  } catch (error) {
    console.error(error);
    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to update device. See console for details."
    );
  }
};

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
              <span className="flex bg-neutral-100 shadow-md text-gray-500 text-xs font-medium me-2 px-2 py-1 rounded-lg dark:bg-neutral-800 dark:text-neutral-400 border dark:border-neutral-700">
            
           <MonitorCog size={25} strokeWidth={0.75} />
              </span>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex flex-col gap-1 font-mono">
             
              <div className="text-xs text-muted-foreground">
                <strong className="text-xs">Name:</strong> {form.name}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong className="text-xs">Service UUID:</strong>{" "}
                {form.serviceUuid}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong className="text-xs">Notify UUID:</strong>{" "}
                {form.readNotifyCharacteristicUuid}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong className="text-xs">Write UUID:</strong>{" "}
                {form.writeCharacteristicUuid}
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
              <Label htmlFor="writeCharacteristicUuid">
                Write Characteristic UUID
              </Label>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
