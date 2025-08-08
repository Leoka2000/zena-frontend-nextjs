"use client";

import React, { useState } from "react";
import { toast } from "sonner";

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
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchDeviceList = async () => {
    const res = await fetch("http://localhost:8080/api/device/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error when fetching device");
    return res.json();
  };

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    if (!selectedName) {
      setSelectedDevice(null);
      return;
    }

    try {
      const deviceList = await fetchDeviceList();
      const matchedDevice = deviceList.find((d: Device) => d.name === selectedName);
      if (matchedDevice) {
        setSelectedDevice(matchedDevice);
        console.log("Selected Device Object:", matchedDevice);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <label className="font-semibold">Select Device:</label>
      <select
        className="border rounded px-2 py-1"
        onChange={handleSelectChange}
        defaultValue=""
      >
        <option value="">-- Select Device --</option>
        {devices.map(d => (
          <option key={d.id} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>
    </>
  );
};

export default DeviceSelect;
