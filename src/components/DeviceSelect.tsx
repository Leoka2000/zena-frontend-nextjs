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

interface Device {
  id: number;
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

interface Props {
  devices: Device[];
  onActiveDeviceChange: (device: Device) => void;
}

const DeviceSelect: React.FC<Props> = ({ devices, onActiveDeviceChange }) => {
  const [activeDeviceId, setActiveDeviceId] = useState<number | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchActiveDevice = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/device/active", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch active device");
      const data = await res.json();
      setActiveDeviceId(data.id);
      onActiveDeviceChange(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleValueChange = async (deviceId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/device/select?deviceId=${deviceId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to set active device");
      toast.success("Active device updated");
      await fetchActiveDevice(); // Refresh instantly
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  useEffect(() => {
    fetchActiveDevice();
  }, []);

  return (
    <div className="mb-5">
      <label className="font-semibold mb-1 block">Select Device:</label>
      <Select
        onValueChange={handleValueChange}
        value={activeDeviceId?.toString() ?? ""}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Select a device" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Devices</SelectLabel>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>
                {d.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DeviceSelect;
