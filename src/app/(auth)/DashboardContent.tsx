import AccelerometerProvider  from "@/components/accelerometer/AccelerometerProvider";
import BluetoothConnectButton from "@/components/BluetoothConnectButton";
import TemperatureProvider from "@/components/temperature/TemperatureProvider";
import React from "react";

const DashboardContent = () => {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <BluetoothConnectButton />
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="bg-muted/50 aspect-video rounded-xl"></div>
          <div className="bg-muted/50 aspect-video rounded-xl" />
          <div className="bg-muted/50 aspect-video rounded-xl" />
        </div>
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
          <TemperatureProvider />
        </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
 <AccelerometerProvider />
        </div>
      </div>
    </>
  );
};

export default DashboardContent;
