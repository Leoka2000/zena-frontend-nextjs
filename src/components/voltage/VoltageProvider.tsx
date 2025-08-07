import React from "react";
import { VoltageChart } from "./VoltageChart";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";

const VoltageProvider = () => {
  const { status, voltageData } = useBluetoothSensor();
 

  return (
    <div className="mb-2  rounded-lg h-full mx-auto">
      <VoltageChart
        voltage={voltageData?.voltage ?? null}
        timestamp={voltageData?.timestamp ?? null}
        status={status}
      />
    </div>
  );
};

export default VoltageProvider;
