"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CopyPlus } from "lucide-react";
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
import DeviceSelect from "@/components/DeviceSelect";

import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import { BottomCardsSection } from "@/components/downer-card-section/BottomCardSection";

import { useBluetoothSensor } from "@/context/useBluetoothSensor";
import { motion } from "framer-motion";
import VoltageProvider from "@/components/voltage/VoltageProvider";
import TemperatureProvider from "@/components/temperature/TemperatureProvider";
import AccelerometerProvider from "@/components/accelerometer/AccelerometerProvider";

interface Device {
  id: string;
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}
interface DeviceForm {
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

const DashboardContent = () => {
  const [hasCreatedFirstDevice, setHasCreatedFirstDevice] = useState<
    boolean | null
  >(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState<DeviceForm>({
    name: "",
    serviceUuid: "",
    readNotifyCharacteristicUuid: "",
    writeCharacteristicUuid: "",
  });

  const { selectedDevice } = useBluetoothSensor();
  const prevDeviceId = useRef<string | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  // Trigger animation key change whenever selectedDevice.id changes
  useEffect(() => {
    if (selectedDevice?.id && selectedDevice.id !== prevDeviceId.current) {
      setAnimateKey((prev) => prev + 1);
      prevDeviceId.current = selectedDevice.id;
    }
  }, [selectedDevice]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchData = async () => {
      const status = await fetch(
        "http://localhost:8080/users/me/device-status",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ).then((r) => r.json());
      setHasCreatedFirstDevice(status.hasCreatedFirstDevice);

      if (status.hasCreatedFirstDevice) {
        const list = await fetch("http://localhost:8080/api/device/list", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json());
        setDevices(list);
      }
    };
    fetchData().catch((err) => toast.error(err.message));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8080/api/device/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    if (!res.ok) return toast.error("Failed to create device");
    toast.success("Device created successfully");
    setHasCreatedFirstDevice(true);
  };

  // Loading spinner JSX
  const LoadingSpinner = () => (
    <div role="status" className="flex justify-center mt-20">
      <svg
        aria-hidden="true"
        className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-emerald-300"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (hasCreatedFirstDevice === null) {
    return <LoadingSpinner />;
  }

  return (
    <div className="gap-4 px-6 py-2">
      {hasCreatedFirstDevice ? (
        <div>
          <BluetoothConnectButton />
          <DeviceSelect devices={devices} />

          {/* Animated Section */}
          <motion.div
            key={animateKey} // Forces re-animation on device change
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="@container/main"
          >
            <div className="flex flex-col gap-2 py-2 pb-4 md:gap-6">
              
              <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
                <BottomCardsSection />
              </div>
            </div>

            <div className="mb-4 rounded-xl">
              <VoltageProvider />
            </div>
            <div className="mb-4  rounded-xl">
              <TemperatureProvider />
            </div>

            <div className="rounded-xl">
              <AccelerometerProvider />
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 mt-10">
          <p className="text-2xl">No registered device yet.</p>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg">
                <CopyPlus /> Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Create New Device</DialogTitle>
                  <DialogDescription>Fill in device details.</DialogDescription>
                </DialogHeader>
                {[
                  "name",
                  "serviceUuid",
                  "readNotifyCharacteristicUuid",
                  "writeCharacteristicUuid",
                ].map((f) => (
                  <div key={f} className="grid gap-3">
                    <Label htmlFor={f}>{f}</Label>
                    <Input
                      id={f}
                      name={f}
                      value={form[f]}
                      onChange={(e) =>
                        setForm({ ...form, [f]: e.target.value })
                      }
                      required
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
        </div>
      )}
    </div>
  );
};

export default DashboardContent;
