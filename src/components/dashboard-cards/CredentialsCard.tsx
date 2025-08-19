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
import { getToken } from "@/lib/auth";
import { toast } from "sonner";

interface Device {
  deviceId: number;
  deviceName: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

export function CredentialsCard() {
  const [device, setDevice] = useState<Device | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  useEffect(() => {
    const fetchActiveDevice = async () => {
      try {
        const token = getToken();
        if (!token) {
          toast.error("Authentication token missing.");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/device/active`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch device: ${res.status}`);
        }

        const data: Device = await res.json();
        setDevice(data);
      } catch (err) {
        console.error(err);
        toast.error("Could not fetch active device.");
      }
    };

    fetchActiveDevice();
  }, []);

  if (!device) return null;

  return (
    <Card className="@container/card transition-transform duration-300 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer">
      <CardHeader>
        <CardDescription>Bluetooth Device</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          Credentials:
        </CardTitle>
        <CardAction>
          <span className="flex bg-neutral-50 shadow-sm text-gray-500 text-xs font-medium me-2 px-2 py-1 rounded-lg dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 border  dark:border-neutral-700">
            <MonitorCog size={25} strokeWidth={1.2} />
          </span>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="flex flex-col gap-1 font-mono">
          <div className="text-xs text-muted-foreground">
            <strong>Name:</strong> {device.deviceName}
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
  );
}
