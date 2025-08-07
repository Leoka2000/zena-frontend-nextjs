import React from "react";
import { ChartLineInteractive } from "./TemperatureChart";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

const TemperatureProvider = () => {
  const { status, temperatureData } = useBluetoothSensor();
  const temperature = temperatureData?.temperature ?? null;
  const timestamp = temperatureData?.timestamp ?? null;

  return (
    <div className="mb-2 h-full rounded-lg mx-auto">
      <ChartLineInteractive 
        temperature={temperature} 
        timestamp={timestamp} 
        status={status} 
      />
    </div>
  );
};

export default TemperatureProvider;