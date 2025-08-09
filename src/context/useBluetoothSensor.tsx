import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  parseAccelerometerHexData,
  parseTemperatureHex,
  parseBatteryVoltageHex,
} from "../lib/utils";
import { getToken } from "@/lib/auth";

// Define types for device and data objects, adjust as needed
interface Device {
  id?: string;
  name?: string;
  serviceUuid: string;
  readNotifyCharacteristicUuid: string;
  writeCharacteristicUuid: string;

}

interface TemperatureData {
  temperature: number;
  
}

interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  
}

interface VoltageData {
  voltage: number;
  timestamp: number;
}

interface BluetoothSensorContextValue {
  status: string;
  isConnected: boolean;
  temperatureData: TemperatureData | null;
  accelerometerData: AccelerometerData | null;
  voltageData: VoltageData | null;
  connectBluetooth: () => Promise<void>;
  disconnectBluetooth: () => Promise<void>;
  lastUpdateTimestamp: number | null;
  serviceUuid: string | null;
  readNotifyCharacteristicUuid: string | null;
  writeCharacteristicUuid: string | null;
  selectedDevice: Device | null;
  setSelectedDevice: (device: Device | null) => void;
}

// Provide default context value matching type or null for initial
const BluetoothSensorContext = createContext<BluetoothSensorContextValue | null>(
  null
);

interface BluetoothSensorProviderProps {
  children: ReactNode;
}

export const BluetoothSensorProvider = ({ children }: BluetoothSensorProviderProps) => {
  const [status, setStatus] = useState<string>("Disconnected");
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null);
  const [accelerometerData, setAccelerometerData] = useState<AccelerometerData | null>(
    null
  );
  const [voltageData, setVoltageData] = useState<VoltageData | null>(null);
  const [selectedDevice, setSelectedDeviceState] = useState<Device | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedDevice");
      if (stored) {
        try {
          const parsedDevice = JSON.parse(stored) as Device;
          setSelectedDeviceState(parsedDevice);
          console.log(
            "🌐 Page loaded - selectedDevice from localStorage:",
            parsedDevice
          );
        } catch {
          setSelectedDeviceState(null);
          console.log(
            "🌐 Page loaded - selectedDevice from localStorage: null (parse error)"
          );
        }
      } else {
        console.log(
          "🌐 Page loaded - selectedDevice from localStorage: null (no stored device)"
        );
      }
    }
  }, []);

  useEffect(() => {
    if (device) {
      disconnectBluetooth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDevice]);

  useEffect(() => {
    console.log("🔄 selectedDevice changed:", selectedDevice);
  }, [selectedDevice]);

  const setSelectedDevice = (device: Device | null) => {
    setSelectedDeviceState(device);
    if (typeof window !== "undefined") {
      if (device) {
        localStorage.setItem("selectedDevice", JSON.stringify(device));
      } else {
        localStorage.removeItem("selectedDevice");
      }
    }
  };

  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lastUpdateTimestamp");
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  });

  const notifyCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const writeCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const writeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendWriteRequest = useCallback(async () => {
    if (!writeCharRef.current) return;

    const unixTimestamp = Math.floor(Date.now() / 1000);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, unixTimestamp, false);

    try {
      await writeCharRef.current.writeValue(buffer);
    } catch (error) {
      console.error("Write error:", error);
    }
  }, []);

  const startWriteInterval = useCallback(() => {
    writeIntervalRef.current = setInterval(sendWriteRequest, 60000);
  }, [sendWriteRequest]);

  const stopWriteInterval = useCallback(() => {
    if (writeIntervalRef.current) {
      clearInterval(writeIntervalRef.current);
      writeIntervalRef.current = null;
    }
  }, []);

  const handleCharacteristicValueChanged = useCallback(
    async (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const value = target.value;
      if (!value) return;

      let hexString = "0x";
      for (let i = 0; i < value.byteLength; i++) {
        hexString += ("00" + value.getUint8(i).toString(16)).slice(-2);
      }
      console.log("📦 Received HEX data from Bluetooth device:", hexString);
      try {
        const parsedTemperature = parseTemperatureHex(hexString);
        const parsedAccelerometer = parseAccelerometerHexData(hexString);
        const batteryData = parseBatteryVoltageHex(hexString);
        console.log("🔋 Battery Level:", batteryData?.voltage);
        const token = getToken();
        const timestamp = Math.floor(Date.now() / 1000);
        setLastUpdateTimestamp(timestamp);
        localStorage.setItem("lastUpdateTimestamp", timestamp.toString());

        if (parsedTemperature?.temperature) {
          setTemperatureData(parsedTemperature);
          await fetch("http://localhost:8080/api/temperature", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              temperature: parsedTemperature.temperature,
              timestamp: timestamp,
            }),
          });
        }

        if (parsedAccelerometer?.x !== undefined) {
          setAccelerometerData(parsedAccelerometer);
          await fetch("http://localhost:8080/api/accelerometer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              x: parsedAccelerometer.x,
              y: parsedAccelerometer.y,
              z: parsedAccelerometer.z,
              timestamp: timestamp,
            }),
          });
        }

        if (batteryData !== undefined && batteryData !== null) {
          const timestamp = Math.floor(Date.now() / 1000);
          setVoltageData({ voltage: batteryData, timestamp });
          await fetch("http://localhost:8080/api/voltage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              voltage: batteryData,
              timestamp,
            }),
          });
        }

        setStatus("Receiving data...");
      } catch (error) {
        console.error("Error processing device data:", error);
        setStatus("Failed to process data");
      }
    },
    []
  );

  const connectBluetooth = useCallback(async () => {
    if (!navigator.bluetooth) {
      setStatus("Web Bluetooth not supported");
      return;
    }

    if (!selectedDevice) {
      setStatus("No device selected");
      console.warn("Cannot connect: no selectedDevice set");
      return;
    }

    try {
      setStatus("Requesting Bluetooth device...");
      // Use serviceUuid dynamically from selectedDevice
      const deviceFound = await navigator.bluetooth.requestDevice({
        filters: [{ services: [selectedDevice.serviceUuid] }],
        optionalServices: [selectedDevice.serviceUuid],
      });

      setDevice(deviceFound);
      setStatus("Connecting to GATT server...");
      const server = await deviceFound.gatt!.connect();

      // Use dynamic UUIDs for service and characteristics
      const service = await server.getPrimaryService(selectedDevice.serviceUuid);
      const notifyChar = await service.getCharacteristic(
        selectedDevice.readNotifyCharacteristicUuid
      );
      const writeChar = await service.getCharacteristic(
        selectedDevice.writeCharacteristicUuid
      );

      notifyCharRef.current = notifyChar;
      writeCharRef.current = writeChar;

      notifyChar.addEventListener(
        "characteristicvaluechanged",
        handleCharacteristicValueChanged
      );
      await notifyChar.startNotifications();

      setStatus("Connected and receiving data");
      setIsConnected(true);

      sendWriteRequest();
      startWriteInterval();
    } catch (error: unknown) {
      console.error("Bluetooth connection error:", error);
      if (error instanceof Error) {
        setStatus(`Connection failed: ${error.message}`);
      } else {
        setStatus("Connection failed: unknown error");
      }
      throw error;
    }
  }, [
    handleCharacteristicValueChanged,
    sendWriteRequest,
    startWriteInterval,
    selectedDevice,
  ]);

  const disconnectBluetooth = useCallback(async () => {
    setStatus("Disconnecting...");
    stopWriteInterval();

    if (notifyCharRef.current) {
      try {
        await notifyCharRef.current.stopNotifications();
        notifyCharRef.current.removeEventListener(
          "characteristicvaluechanged",
          handleCharacteristicValueChanged
        );
      } catch (error) {
        console.warn("Notification cleanup error:", error);
      }
    }

    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }

    setIsConnected(false);
    setTemperatureData(null);
    setAccelerometerData(null);
    setVoltageData(null);
    setDevice(null);
    setStatus("Disconnected");
  }, [device, handleCharacteristicValueChanged, stopWriteInterval]);

  useEffect(() => {
    return () => {
      disconnectBluetooth();
    };
  }, [disconnectBluetooth]);

  return (
    <BluetoothSensorContext.Provider
      value={{
        status,
        isConnected,
        temperatureData,
        accelerometerData,
        voltageData,
        connectBluetooth,
        disconnectBluetooth,
        lastUpdateTimestamp,
        serviceUuid: selectedDevice?.serviceUuid ?? null,
        readNotifyCharacteristicUuid:
          selectedDevice?.readNotifyCharacteristicUuid ?? null,
        writeCharacteristicUuid:
          selectedDevice?.writeCharacteristicUuid ?? null,
        selectedDevice,
        setSelectedDevice,
      }}
    >
      {children}
    </BluetoothSensorContext.Provider>
  );
};

export const useBluetoothSensor = () => {
  const context = useContext(BluetoothSensorContext);
  if (!context) {
    throw new Error("useBluetoothSensor must be used within a BluetoothSensorProvider");
  }
  return context;
};
