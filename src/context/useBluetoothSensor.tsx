"use client";

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
  isDeviceConnected: (deviceId: string) => boolean;
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

  // characteristic refs per device id
  const notifyCharRefs = useRef<Record<string, BluetoothRemoteGATTCharacteristic>>({});
  const writeCharRefs = useRef<Record<string, BluetoothRemoteGATTCharacteristic>>({});
  // store the actual BluetoothDevice so we can disconnect properly
  const bluetoothDeviceRefs = useRef<Record<string, BluetoothDevice>>({});
  // browser timer id type is number
  const writeIntervals = useRef<Record<string, number>>({});

  // Helper: robust write (choose with/without response appropriately)
  const safeWrite = useCallback(
    async (char: BluetoothRemoteGATTCharacteristic, buffer: ArrayBuffer) => {
      try {
        // Prefer writeValueWithResponse if available
        // Some browsers expose these methods as optional; use as any to call if present.
        // If not available, fallback to writeValue (legacy) or writeValueWithoutResponse.
        const anyChar = char as any;
        if (anyChar.writeValueWithResponse) {
          await anyChar.writeValueWithResponse(buffer);
          return;
        }
        if (char.properties.write) {
          await char.writeValue(buffer);
          return;
        }
        if (anyChar.writeValueWithoutResponse) {
          await anyChar.writeValueWithoutResponse(buffer);
          return;
        }
        throw new Error("Characteristic does not support write operations");
      } catch (err) {
        console.error("safeWrite failed:", err);
        throw err;
      }
    },
    []
  );

  // send a 4-byte unix timestamp (seconds). Big-endian by default; change endianness if required by MCU.
  const sendWriteRequest = useCallback(
    async (deviceId: string) => {
      const writeChar = writeCharRefs.current[deviceId];
      if (!writeChar) return;

      const unixTimestamp = Math.floor(Date.now() / 1000);
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, unixTimestamp, false); // false = big-endian; set true if MCU expects little-endian

      try {
        await safeWrite(writeChar, buffer);
      } catch (error) {
        console.error(`Write error for ${deviceId}:`, error);
      }
    },
    [safeWrite]
  );

  const startWriteInterval = useCallback(
    (deviceId: string) => {
      // if already started, skip
      if (writeIntervals.current[deviceId]) return;
      // store number returned by window.setInterval
      const id = window.setInterval(() => {
        sendWriteRequest(deviceId);
      }, 60000); // every 60s
      writeIntervals.current[deviceId] = id as unknown as number;
    },
    [sendWriteRequest]
  );

  const stopWriteInterval = useCallback((deviceId: string) => {
    const id = writeIntervals.current[deviceId];
    if (id) {
      window.clearInterval(id);
      delete writeIntervals.current[deviceId];
    }
  }, []);

  const handleCharacteristicValueChanged = useCallback(
    async (event: Event, device: Device) => {
      try {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (!value) return;

        // convert to hex string like "0x...."
        let hexString = "0x";
        for (let i = 0; i < value.byteLength; i++) {
          hexString += ("00" + value.getUint8(i).toString(16)).slice(-2);
        }
        console.log(`📦 [${device.id}] Received HEX:`, hexString);

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
            device,
            isConnected: true,
          },
        }));

        // Post to backend if data exists
        // Note: we don't block UI on these; but we await so errors are catchable
        if (parsedTemperature?.temperature !== undefined) {
          fetch("http://localhost:8080/api/temperature", {
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
          }).catch((e) =>
            console.error("Failed to POST temperature to backend:", e)
          );
        }

        if (parsedAccelerometer) {
          fetch("http://localhost:8080/api/accelerometer", {
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
          }).catch((e) =>
            console.error("Failed to POST accelerometer to backend:", e)
          );
        }

        if (batteryData !== undefined) {
          fetch("http://localhost:8080/api/voltage", {
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
          }).catch((e) =>
            console.error("Failed to POST voltage to backend:", e)
          );
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
        console.warn("Web Bluetooth not supported in this browser");
        return;
      }

      const deviceId = device.id ?? `${device.name || "ble"}-${device.serviceUuid}-${device.readNotifyCharacteristicUuid}`;

      try {
        console.log(`🔌 Connecting via provider to ${device.name || deviceId}`);

        // Ask user to select device if no existing BluetoothDevice
        // We will try to use requestDevice to ensure user selection on the client
        const deviceFound = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [device.serviceUuid],
        });

        if (!deviceFound) {
          throw new Error("No device selected");
        }

        // store BluetoothDevice ref
        bluetoothDeviceRefs.current[deviceId] = deviceFound;

        const server = await deviceFound.gatt!.connect();
        const service = await server.getPrimaryService(device.serviceUuid);

        // fetch characteristics by UUIDs provided
        const notifyChar = await service.getCharacteristic(
          device.readNotifyCharacteristicUuid
        );
        const writeChar = await service.getCharacteristic(
          device.writeCharacteristicUuid
        );

        // save refs
        notifyCharRefs.current[deviceId] = notifyChar;
        writeCharRefs.current[deviceId] = writeChar;

        // attach listener
        const listener = (event: Event) =>
          handleCharacteristicValueChanged(event, device);
        notifyChar.addEventListener("characteristicvaluechanged", listener);
        await notifyChar.startNotifications();

        // update connection state
        setConnectedDevices((prev) => ({
          ...prev,
          [deviceId]: {
            device,
            isConnected: true,
            lastUpdateTimestamp: Math.floor(Date.now() / 1000),
          },
        }));

        // send initial write immediately and start periodic writes
        await sendWriteRequest(deviceId);
        startWriteInterval(deviceId);

        console.log(`✅ Connected (provider) to ${device.name || deviceId}`);
      } catch (error) {
        console.error(`Bluetooth connection error for ${deviceId}:`, error);
        // ensure we set a disconnected state
        setConnectedDevices((prev) => ({
          ...prev,
          [deviceId]: { ...(prev[deviceId] ?? { device }), isConnected: false },
        }));
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
          notifyChar.removeEventListener("characteristicvaluechanged", () => {});
        } catch (err) {
          console.warn(`Stop notifications error for ${deviceId}:`, err);
        }
        delete notifyCharRefs.current[deviceId];
      }

      // Disconnect GATT device if we have it
      const btDevice = bluetoothDeviceRefs.current[deviceId];
      if (btDevice && btDevice.gatt && btDevice.gatt.connected) {
        try {
          btDevice.gatt.disconnect();
        } catch (err) {
          console.warn("Error disconnecting GATT device:", err);
        }
      }
      delete bluetoothDeviceRefs.current[deviceId];
      delete writeCharRefs.current[deviceId];

      setConnectedDevices((prev) => ({
        ...prev,
        [deviceId]: { ...prev[deviceId], isConnected: false },
      }));
    },
    [stopWriteInterval]
  );

  const isDeviceConnected = useCallback(
    (deviceId: string) => !!connectedDevices[deviceId]?.isConnected,
    [connectedDevices]
  );

  // cleanup on unmount
  useEffect(() => {
    return () => {
      // clear intervals and disconnect devices
      Object.keys(writeIntervals.current).forEach((id) => {
        window.clearInterval(writeIntervals.current[id]);
      });
      Object.keys(bluetoothDeviceRefs.current).forEach((id) => {
        const bt = bluetoothDeviceRefs.current[id];
        try {
          if (bt && bt.gatt && bt.gatt.connected) bt.gatt.disconnect();
        } catch {}
      });
    };
  }, []);

  return (
    <BluetoothSensorContext.Provider
      value={{
        connectedDevices,
        connectBluetooth,
        disconnectBluetooth,
        isDeviceConnected,
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
