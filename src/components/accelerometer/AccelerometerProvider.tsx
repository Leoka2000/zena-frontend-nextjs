import React from "react"
import { useBluetoothSensor } from "../../context/useBluetoothSensor"
import { AccelerometerChart } from "./AccelerometerChart"

const AccelerometerProvider = () => {
  const { accelerometerData: liveData, status } = useBluetoothSensor()

  return (
    <div className="p-4 mb-2 dark:bg-neutral-950 rounded-lg h-full mx-auto">
      <AccelerometerChart liveData={liveData} status={status} />
    </div>
  )
}

export default AccelerometerProvider