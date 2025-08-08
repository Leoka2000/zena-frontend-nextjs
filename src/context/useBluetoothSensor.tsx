import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  parseAccelerometerHexData,
  parseTemperatureHex,
  parseBatteryVoltageHex,
} from "../lib/utils";
import { getToken } from "@/lib/auth";

const BluetoothSensorContext = createContext(null);

export const BluetoothSensorProvider = ({ children }) => {
  const [status, setStatus] = useState("Disconnected");
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [temperatureData, setTemperatureData] = useState(null);
  const [accelerometerData, setAccelerometerData] = useState(null);
  const [voltageData, setVoltageData] = useState(null);

  const [selectedDevice, setSelectedDeviceState] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedDevice");
      if (stored) {
        try {
          const parsedDevice = JSON.parse(stored);
          setSelectedDeviceState(parsedDevice);
          console.log("🌐 Page loaded - selectedDevice from localStorage:", parsedDevice);
        } catch {
          setSelectedDeviceState(null);
          console.log("🌐 Page loaded - selectedDevice from localStorage: null (parse error)");
        }
      } else {
        console.log("🌐 Page loaded - selectedDevice from localStorage: null (no stored device)");
      }
    }
  }, []);

  useEffect(() => {
    console.log("🔄 selectedDevice changed:", selectedDevice);
  }, [selectedDevice]);

  const setSelectedDevice = (device) => {
    setSelectedDeviceState(device);
    if (typeof window !== "undefined") {
      if (device) {
        localStorage.setItem("selectedDevice", JSON.stringify(device));
      } else {
        localStorage.removeItem("selectedDevice");
      }
    }
  };

  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lastUpdateTimestamp");
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  });

  const notifyCharRef = useRef(null);
  const writeCharRef = useRef(null);
  const writeIntervalRef = useRef(null);

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

  const handleCharacteristicValueChanged = useCallback(async (event) => {
    const value = event.target.value;

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
  }, []);

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
      const server = await deviceFound.gatt.connect();

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
    } catch (error) {
      console.error("Bluetooth connection error:", error);
      setStatus(`Connection failed: ${error.message}`);
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
        // Provide dynamic UUIDs for any consumer that needs them
        serviceUuid: selectedDevice?.serviceUuid ?? null,
        readNotifyCharacteristicUuid: selectedDevice?.readNotifyCharacteristicUuid ?? null,
        writeCharacteristicUuid: selectedDevice?.writeCharacteristicUuid ?? null,
        selectedDevice,
        setSelectedDevice,
      }}
    >
      {children}
    </BluetoothSensorContext.Provider>
  );
};

export const useBluetoothSensor = () => useContext(BluetoothSensorContext);
