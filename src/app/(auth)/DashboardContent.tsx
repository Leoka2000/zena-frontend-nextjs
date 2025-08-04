import AccelerometerProvider from "@/components/accelerometer/AccelerometerProvider";
import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import TemperatureProvider from "@/components/temperature/TemperatureProvider";
import VoltageProvider from "@/components/voltage/VoltageProvider";
import React from "react";

const DashboardContent = () => (
  <>
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <BluetoothConnectButton />
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <div className="bg-muted/50 rounded-xl">
          <VoltageProvider />
        </div>
         <div className="bg-muted/50 rounded-xl">
     
        </div>
              </div>
        <div className="bg-muted/50 rounded-xl">
          <TemperatureProvider />
        </div>

      <div className="bg-muted/50 rounded-xl">
        <AccelerometerProvider />
      </div>
    </div>
  </>
);

export default DashboardContent;
