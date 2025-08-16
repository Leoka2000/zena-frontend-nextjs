"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import DeviceSelect from "@/components/DeviceSelect";
import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import { BottomCardsSection } from "@/components/downer-card-section/BottomCardSection";
import TemperatureProvider from "@/components/temperature/TemperatureProvider";
import { AccelerometerChart } from "@/components/accelerometer/AccelerometerChart";
import { VoltageChart } from "@/components/voltage/VoltageChart";

const DashboardContent = () => {
  const [animateKey, setAnimateKey] = useState(0);
  const [deviceSelectionTrigger, setDeviceSelectionTrigger] =
    useState<number>(0);

  // When the child bumps deviceSelectionTrigger, re-mount the animated section
  useEffect(() => {
    if (deviceSelectionTrigger === 0) return; // ignore initial mount
    setAnimateKey((prev) => prev + 1);
  }, [deviceSelectionTrigger]);

  return (
    <div className="gap-4 px-6 py-2">
      <div>
        <BluetoothConnectButton />
        <DeviceSelect setDeviceSelectionTrigger={setDeviceSelectionTrigger} />

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
            <TemperatureProvider />
          </div>
          <div className="mb-4 rounded-xl">
            <AccelerometerChart />
          </div>
           <div className="mb-4 rounded-xl">
          <VoltageChart />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardContent;
