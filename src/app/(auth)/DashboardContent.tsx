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
import { motion } from "framer-motion";
import VoltageProvider from "@/components/voltage/VoltageProvider";
import TemperatureProvider from "@/components/temperature/TemperatureProvider";
import AccelerometerProvider from "@/components/accelerometer/AccelerometerProvider";

interface Device {
  id: number;
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
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const prevDeviceId = useRef<number | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  const [form, setForm] = useState<DeviceForm>({
    name: "",
    serviceUuid: "",
    readNotifyCharacteristicUuid: "",
    writeCharacteristicUuid: "",
  });

  // Trigger animation when active device changes
  useEffect(() => {
    if (activeDevice?.id && activeDevice.id !== prevDeviceId.current) {
      setAnimateKey((prev) => prev + 1);
      prevDeviceId.current = activeDevice.id;
    }
  }, [activeDevice]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchData = async () => {
      try {
        const status = await fetch(
          "http://localhost:8080/users/me/device-status",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        ).then((r) => r.json());

        setHasCreatedFirstDevice(status.hasCreatedFirstDevice);

        if (status.hasCreatedFirstDevice) {
          const list = await fetch("http://localhost:8080/api/device/list", {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json());
          setDevices(list);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unexpected error");
      }
    };
    fetchData();
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

  if (hasCreatedFirstDevice === null) {
    return (
      <div role="status" className="flex justify-center mt-20">
        {/* Spinner */}
        <svg
          aria-hidden="true"
          className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-emerald-300"
          viewBox="0 0 100 101"
        >
          <path d="..." fill="currentColor" />
          <path d="..." fill="currentFill" />
        </svg>
      </div>
    );
  }

  return (
    <div className="gap-4 px-6 py-2">
      {hasCreatedFirstDevice ? (
        <div>
          <BluetoothConnectButton />
          <DeviceSelect
            devices={devices}
            onActiveDeviceChange={setActiveDevice}
          />

          {/* Animated Section */}
          <motion.div
            key={animateKey}
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
            <div className="mb-4 rounded-xl">
              <TemperatureProvider />
            </div>
            <div className="rounded-xl">
              <AccelerometerProvider />
            </div>
          </motion.div>
        </div>
      ) : (
        // Create Device Form
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
                      value={form[f as keyof DeviceForm]}
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
