import React from "react";
import { VoltageChart } from "./VoltageChart";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

const VoltageProvider = () => {
  const { status, voltageData } = useBluetoothSensor();
  const voltage = voltageData?.voltage ?? null;
  const timestamp = voltageData?.timestamp ?? null;

  return (
    <div className="p-4 mb-2 dark:bg-neutral-950 rounded-lg h-full mx-auto">
      <VoltageChart
        voltage={voltageData?.voltage ?? null}
        timestamp={voltageData?.timestamp ?? null}
        status={status}
      />
    </div>
  );
};

export default VoltageProvider;
