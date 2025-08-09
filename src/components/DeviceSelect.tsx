"use client";

import React, { useEffect } from "react";
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
import { useBluetoothSensor } from "../context/useBluetoothSensor"; // Adjust import path accordingly

interface Device {
  id: number;
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

interface Props {
  devices: Device[];
}

const DeviceSelect: React.FC<Props> = ({ devices }) => {
  const { selectedDevice, setSelectedDevice } = useBluetoothSensor();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchDeviceList = async (): Promise<Device[]> => {
    const res = await fetch("http://localhost:8080/api/device/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error when fetching device");
    return res.json();
  };

  useEffect(() => {
    if (selectedDevice) {
      console.log("🌟 Selected device updated:", selectedDevice);
      console.log("🔑 Service UUID:", selectedDevice.serviceUuid);
      console.log(
        "🔑 Read Notify Characteristic UUID:",
        selectedDevice.readNotifyCharacteristicUuid
      );
      console.log(
        "🔑 Write Characteristic UUID:",
        selectedDevice.writeCharacteristicUuid
      );
    }
  }, [selectedDevice]);

  const handleValueChange = async (value: string) => {
    if (!value) {
      setSelectedDevice(null);
      return;
    }

    try {
      const deviceList = await fetchDeviceList();
      const matchedDevice = deviceList.find((d) => d.name === value);
      if (matchedDevice) {
        setSelectedDevice(matchedDevice);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="mb-5">
      <label className="font-semibold mb-1 block">Select Device:</label>
      <Select
        onValueChange={handleValueChange}
        value={selectedDevice?.name ?? ""}
        defaultValue=""
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="Select a device" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Devices</SelectLabel>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.name}>
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
