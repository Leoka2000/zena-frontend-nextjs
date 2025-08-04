import React from "react";
import { ChartLineInteractive } from "./TemperatureChart";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

const TemperatureProvider = () => {
  const { status, temperatureData } = useBluetoothSensor();
  const temperature = temperatureData?.temperature ?? null;
  const timestamp = temperatureData?.timestamp ?? null;

  return (
    <div className="p-4 mb-2 dark:bg-neutral-950 h-full rounded-lg mx-auto">
      <ChartLineInteractive 
        temperature={temperature} 
        timestamp={timestamp} 
        status={status} 
      />
    </div>
  );
};

export default TemperatureProvider;