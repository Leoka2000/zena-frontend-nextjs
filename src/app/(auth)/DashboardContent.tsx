"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import DeviceSelect from "@/components/DeviceSelect";
import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import { BottomCardsSection } from "@/components/downer-card-section/BottomCardSection";
import TemperatureProvider from "@/components/temperature/TemperatureProvider";

const DashboardContent = () => {
  const [animateKey, setAnimateKey] = useState(0);
  const prevDeviceId = useRef<number | null>(null);

  // Fetch active device and trigger animation when id changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchActiveDevice = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/device/active", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch active device");

        const data = await res.json();

        if (data?.id && data.id !== prevDeviceId.current) {
          setAnimateKey((prev) => prev + 1);
          prevDeviceId.current = data.id;
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unexpected error");
      }
    };

    fetchActiveDevice();
    const interval = setInterval(fetchActiveDevice, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gap-4 px-6 py-2">
      <div>
        <BluetoothConnectButton />
        <DeviceSelect />

        {/* Animated Section */}
        <motion.div
          key={animateKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="@container/main"
        >
          <div className="flex flex-col gap-2 py-2 pb-4 md:gap-6">
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
              <BottomCardsSection />
            </div>
          </div>

          <div className="mb-4 rounded-xl">
            <TemperatureProvider />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardContent;
