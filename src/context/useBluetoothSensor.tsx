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

interface ConnectedDeviceState {
  device: Device;
  isConnected: boolean;
  temperatureData?: TemperatureData;
  accelerometerData?: AccelerometerData;
  voltageData?: VoltageData;
  lastUpdateTimestamp?: number;
}

interface BluetoothSensorContextValue {
  connectedDevices: Record<string, ConnectedDeviceState>;
  connectBluetooth: (device: Device) => Promise<void>;
  disconnectBluetooth: (deviceId: string) => Promise<void>;
}

const BluetoothSensorContext =
  createContext<BluetoothSensorContextValue | null>(null);

interface BluetoothSensorProviderProps {
  children: ReactNode;
}

export const BluetoothSensorProvider = ({
  children,
}: BluetoothSensorProviderProps) => {
  const [connectedDevices, setConnectedDevices] = useState<
    Record<string, ConnectedDeviceState>
  >({});

  // Store characteristic refs per device
  const notifyCharRefs = useRef<
    Record<string, BluetoothRemoteGATTCharacteristic>
  >({});
  const writeCharRefs = useRef<
    Record<string, BluetoothRemoteGATTCharacteristic>
  >({});
  const writeIntervals = useRef<Record<string, NodeJS.Timeout>>({});

  const sendWriteRequest = useCallback(async (deviceId: string) => {
    const writeChar = writeCharRefs.current[deviceId];
    if (!writeChar) return;

    const unixTimestamp = Math.floor(Date.now() / 1000);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, unixTimestamp, false);

    try {
      await writeChar.writeValue(buffer);
    } catch (error) {
      console.error(`Write error for ${deviceId}:`, error);
    }
  }, []);

  const startWriteInterval = useCallback(
    (deviceId: string) => {
      writeIntervals.current[deviceId] = setInterval(() => {
        sendWriteRequest(deviceId);
      }, 60000);
    },
    [sendWriteRequest]
  );

  const stopWriteInterval = useCallback((deviceId: string) => {
    if (writeIntervals.current[deviceId]) {
      clearInterval(writeIntervals.current[deviceId]);
      delete writeIntervals.current[deviceId];
    }
  }, []);

  const handleCharacteristicValueChanged = useCallback(
    async (event: Event, device: Device) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const value = target.value;
      if (!value) return;

      let hexString = "0x";
      for (let i = 0; i < value.byteLength; i++) {
        hexString += ("00" + value.getUint8(i).toString(16)).slice(-2);
      }
      console.log(`📦 [${device.id}] Received HEX:`, hexString);

      try {
        const parsedTemperature = parseTemperatureHex(hexString);
        const parsedAccelerometer = parseAccelerometerHexData(hexString);
        const batteryData = parseBatteryVoltageHex(hexString);

        const token = getToken();
        const timestamp = Math.floor(Date.now() / 1000);

        setConnectedDevices((prev) => ({
          ...prev,
          [device.id!]: {
            ...prev[device.id!],
            temperatureData:
              parsedTemperature || prev[device.id!]?.temperatureData,
            accelerometerData:
              parsedAccelerometer || prev[device.id!]?.accelerometerData,
            voltageData:
              batteryData !== undefined
                ? { voltage: batteryData, timestamp }
                : prev[device.id!]?.voltageData,
            lastUpdateTimestamp: timestamp,
          },
        }));

        if (parsedTemperature?.temperature) {
          await fetch("http://localhost:8080/api/temperature", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId: device.id,
              temperature: parsedTemperature.temperature,
              timestamp,
            }),
          });
        }

        if (parsedAccelerometer) {
          await fetch("http://localhost:8080/api/accelerometer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId: device.id,
              ...parsedAccelerometer,
              timestamp,
            }),
          });
        }

        if (batteryData !== undefined) {
          await fetch("http://localhost:8080/api/voltage", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              deviceId: device.id,
              voltage: batteryData,
              timestamp,
            }),
          });
        }
      } catch (error) {
        console.error(`Error processing data for ${device.id}:`, error);
      }
    },
    []
  );

  const connectBluetooth = useCallback(
    async (device: Device) => {
      if (!navigator.bluetooth) {
        console.warn("Web Bluetooth not supported");
        return;
      }

      try {
        console.log(`🔌 Connecting to ${device.name || device.id}`);
        const deviceFound = await navigator.bluetooth.requestDevice({
          filters: [{ services: [device.serviceUuid] }],
          optionalServices: [device.serviceUuid],
        });

        const server = await deviceFound.gatt!.connect();
        const service = await server.getPrimaryService(device.serviceUuid);

        const notifyChar = await service.getCharacteristic(
          device.readNotifyCharacteristicUuid
        );
        const writeChar = await service.getCharacteristic(
          device.writeCharacteristicUuid
        );

        notifyCharRefs.current[device.id!] = notifyChar;
        writeCharRefs.current[device.id!] = writeChar;

        notifyChar.addEventListener("characteristicvaluechanged", (event) =>
          handleCharacteristicValueChanged(event, device)
        );
        await notifyChar.startNotifications();

        setConnectedDevices((prev) => ({
          ...prev,
          [device.id!]: {
            device,
            isConnected: true,
            lastUpdateTimestamp: Date.now() / 1000,
          },
        }));

        sendWriteRequest(device.id!);
        startWriteInterval(device.id!);

        console.log(`✅ Connected to ${device.name || device.id}`);
      } catch (error) {
        console.error(`Bluetooth connection error for ${device.id}:`, error);
      }
    },
    [handleCharacteristicValueChanged, sendWriteRequest, startWriteInterval]
  );

  const disconnectBluetooth = useCallback(
    async (deviceId: string) => {
      console.log(`🔌 Disconnecting ${deviceId}`);
      stopWriteInterval(deviceId);

      const notifyChar = notifyCharRefs.current[deviceId];
      if (notifyChar) {
        try {
          await notifyChar.stopNotifications();
        } catch (err) {
          console.warn(`Stop notifications error for ${deviceId}:`, err);
        }
        delete notifyCharRefs.current[deviceId];
      }

      // Note: We don't store BluetoothDevice refs here, so disconnection
      // is managed by characteristic cleanup.
      setConnectedDevices((prev) => ({
        ...prev,
        [deviceId]: { ...prev[deviceId], isConnected: false },
      }));
    },
    [stopWriteInterval]
  );

  return (
    <BluetoothSensorContext.Provider
      value={{
        connectedDevices,
        connectBluetooth,
        disconnectBluetooth,
      }}
    >
      {children}
    </BluetoothSensorContext.Provider>
  );
};

export const useBluetoothSensor = () => {
  const context = useContext(BluetoothSensorContext);
  if (!context)
    throw new Error(
      "useBluetoothSensor must be used within BluetoothSensorProvider"
    );
  return context;
};
