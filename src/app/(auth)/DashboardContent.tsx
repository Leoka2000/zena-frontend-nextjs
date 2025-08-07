import AccelerometerProvider from "@/components/accelerometer/AccelerometerProvider";
import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import { DownerCardsSection } from "@/components/downer-card-section/DownerCardSection";
import TemperatureProvider from "@/components/temperature/TemperatureProvider";
import { UpperCardsSection } from "@/components/upper-card-section/UpperCardsSection";

import VoltageProvider from "@/components/voltage/VoltageProvider";
import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

const DashboardContent = () => (
  <>
    <div className="px-4 py-2">

      <BluetoothConnectButton />
    </div>
    <div className="@container/main">
      <UpperCardsSection />
      <DownerCardsSection />
    </div>
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <div className=" rounded-xl">
          <VoltageProvider />
        </div>
        <div className=" rounded-xl"></div>
      </div>
      <div className="rounded-xl">
        <TemperatureProvider />
      </div>

      <div className=" rounded-xl">
        <AccelerometerProvider />
      </div>
    </div>
  </>
);

export default DashboardContent;
