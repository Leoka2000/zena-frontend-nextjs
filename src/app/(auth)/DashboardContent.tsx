import AccelerometerProvider from "@/components/accelerometer/AccelerometerProvider";
import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import { BottomCardsSection } from "@/components/downer-card-section/BottomCardSection";
import TemperatureProvider from "@/components/temperature/TemperatureProvider";
import { TimeElapsed } from "../../components/time-elapsed/TimElapsed";
import { UpperCardsSection } from "@/components/upper-card-section/UpperCardsSection";

import VoltageProvider from "@/components/voltage/VoltageProvider";
import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

const DashboardContent = () => (
  <>
    <div className="flex items-center gap-2 px-4 py-2">

      <BluetoothConnectButton  />
      <TimeElapsed />

    </div>
    <div className="@container/main">
     
      <BottomCardsSection />
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
