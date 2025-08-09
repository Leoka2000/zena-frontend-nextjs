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
import { LogoutButton } from "@/components/LogoutButton";
import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import { BottomCardsSection } from "@/components/downer-card-section/BottomCardSection";
import { UpperCardsSection } from "@/components/upper-card-section/UpperCardsSection";
import { CredentialsCard } from "@/components/dashboard-cards/CredentialsCard";
import { useBluetoothSensor } from "@/context/useBluetoothSensor";
import { motion } from "framer-motion";

interface DeviceForm {
  name: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;
}

const DashboardContent = () => {
  const [hasCreatedFirstDevice, setHasCreatedFirstDevice] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
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
      const status = await fetch("http://localhost:8080/users/me/device-status", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());
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
                      value={(form as any)[f]}
                      onChange={(e) => setForm({ ...form, [f]: e.target.value })}
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
