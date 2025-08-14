"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getToken } from "../lib/auth";

interface Device {
  id: number;
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

interface ActiveDeviceResponse {
  deviceId: number;
  deviceName: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

interface DeviceSelectProps {
  setDeviceSelectionTrigger: React.Dispatch<React.SetStateAction<number>>;
}

const DeviceSelect: React.FC<DeviceSelectProps> = ({ setDeviceSelectionTrigger }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  const token = getToken();

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8080/api/device/list", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch devices");
      const data: Device[] = await res.json();
      setDevices(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load devices");
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveDevice = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/device/active", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch active device");
      const data: ActiveDeviceResponse = await res.json();
      setActiveDeviceId(data.deviceId.toString());
    } catch (err) {
      console.error(err);
      setActiveDeviceId("");
    }
  };

  const handleDeviceSelect = async (deviceId: string) => {
    try {
      setIsSelecting(true);

      // Optimistically update the select so the UI reflects the change immediately
      setActiveDeviceId(deviceId);

      const res = await fetch(
        `http://localhost:8080/api/device/select?deviceId=${deviceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to set active device");

      // 🔔 Trigger the parent animation
      setDeviceSelectionTrigger((prev) => prev + 1);

      // (Optional) re-sync with server
      await fetchActiveDevice();

      toast.success("Device selected successfully");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to select device");
    } finally {
      setIsSelecting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchDevices();
      await fetchActiveDevice();
    };
    init();
  }, []);

  return (
    <div className="mb-5">
      <label className="font-semibold mb-1 block">Select Device:</label>
      <Select
        onValueChange={handleDeviceSelect}
        value={activeDeviceId}
        disabled={isLoading || isSelecting}
      >
        <SelectTrigger className="w-[240px]">
          <div className="flex">
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </div>
            ) : (
              <SelectValue
                placeholder={
                  devices.length === 0 ? "No devices available" : "Select a device"
                }
              />
            )}
          </div>
        </SelectTrigger>
        {devices.length > 0 && (
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Your Devices</SelectLabel>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.id.toString()}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        )}
      </Select>
    </div>
  );
};

export default DeviceSelect;
