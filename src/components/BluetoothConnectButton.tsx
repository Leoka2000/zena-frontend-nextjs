"use client";

import React, { useState } from "react";
import {
  Bluetooth,
  BluetoothOff,
  Loader2,
  OctagonPause,
  Play,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBluetoothSensor } from "../context/useBluetoothSensor"; // adjust path if necessary

const KNOWN_SERVICES = [
  "0000180a-0000-1000-8000-00805f9b34fb",
  "11111111-1111-1111-1111-111111111111",
];
interface BluetoothConnectButtonProps {
  onDeviceCreated?: () => void; // optional callback
}

const BluetoothConnectButton: React.FC<BluetoothConnectButtonProps> = ({
  onDeviceCreated,
}) => {
  const { connectBluetooth, disconnectBluetooth, isDeviceConnected } =
    useBluetoothSensor();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>(
    []
  );
  const [isScanning, setIsScanning] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [localConnected, setLocalConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<BluetoothDevice | null>(
    null
  );
  const [workingNotifyChar, setWorkingNotifyChar] = useState<{
    uuid: string;
    serviceUuid: string;
  } | null>(null);
  const [writeCharacteristic, setWriteCharacteristic] = useState<{
    uuid: string;
    serviceUuid: string;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deviceName, setDeviceName] = useState("My BLE Device");
  const [isCreating, setIsCreating] = useState(false);

  // NEW state for streaming toggle
  const [isStreaming, setIsStreaming] = useState(false);

  // Test characteristic by trying read or notifications
  const testCharacteristic = async (
    characteristic: BluetoothRemoteGATTCharacteristic
  ) => {
    try {
      await characteristic.readValue();
      return true;
    } catch (readError) {}

    try {
      await characteristic.startNotifications();
      await characteristic.stopNotifications();
      return true;
    } catch (notifyError) {}

    return false;
  };

  const discoverServicesAndCharacteristics = async (
    device: BluetoothDevice
  ) => {
    try {
      setIsDiscovering(true);
      toast.info("Discovering services...");
      if (!device.gatt) throw new Error("GATT server not available");

      const server = await device.gatt.connect();
      console.log("Connected to GATT server for discovery");

      const services = await server.getPrimaryServices();
      console.log(`Found ${services.length} primary services`);

      const notifyChars: BluetoothRemoteGATTCharacteristic[] = [];

      for (const service of services) {
        const chars = await service.getCharacteristics();
        for (const char of chars) {
          if (char.properties.write) {
            setWriteCharacteristic({
              uuid: char.uuid,
              serviceUuid: service.uuid,
            });
          }
          if (char.properties.notify) {
            notifyChars.push(char);
          }
        }
      }

      for (const c of notifyChars) {
        const ok = await testCharacteristic(c);
        if (ok) {
          setWorkingNotifyChar({
            uuid: c.uuid,
            serviceUuid: c.service.uuid,
          });
          break;
        }
      }

      toast.success("Service discovery complete");
      setShowCreateModal(true);
    } catch (error) {
      console.error("Discovery error:", error);
      toast.error("Failed to discover services");
    } finally {
      setIsDiscovering(false);
    }
  };

  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      setAvailableDevices([]);
      setWorkingNotifyChar(null);
      setWriteCharacteristic(null);
      toast.info("Scanning for BLE devices...");

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_SERVICES,
      });

      if (!device) throw new Error("No device selected");

      setAvailableDevices([device]);
      setCurrentDevice(device);

      if (device.gatt) {
        await device.gatt.connect();
        setLocalConnected(true);
        await discoverServicesAndCharacteristics(device);
      } else {
        throw new Error("Device doesn't support GATT");
      }
    } catch (error: unknown) {
      console.error("Scan error:", error);
      toast.error(
        error instanceof DOMException ? error.message : "Connection failed"
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = () => {
    if (currentDevice?.gatt?.connected) {
      currentDevice.gatt.disconnect();
    }
    setLocalConnected(false);
    setCurrentDevice(null);
    setWorkingNotifyChar(null);
    setWriteCharacteristic(null);
    setIsStreaming(false); // reset streaming state
    toast.info("Disconnected from device");
  };

  const handleCreateDevice = async () => {
    if (!workingNotifyChar || !writeCharacteristic || !currentDevice) return;

    try {
      setIsCreating(true);
      const response = await fetch(
        `${API_BASE_URL}/api/device/create-from-bluetooth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            name: deviceName,
            serviceUuid: workingNotifyChar.serviceUuid,
            notifyCharacteristicUuid: workingNotifyChar.uuid,
            writeCharacteristicUuid: writeCharacteristic.uuid,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data && data.message) || "Failed to create device");
      }

      toast.success("Device created successfully");
      setShowCreateModal(false);
      setDeviceName("My BLE Device");
      if (onDeviceCreated) onDeviceCreated();
    } catch (error: unknown) {
      console.error("Create error:", error);
      toast.error(error.message || "Failed to create device");
    } finally {
      setIsCreating(false);
    }
  };

  // Start streaming
  const handleStartStreaming = async () => {
    if (!workingNotifyChar || !writeCharacteristic) {
      toast.error("Missing notify or write characteristic");
      return;
    }

    const deviceForProvider = {
      id:
        currentDevice?.id ||
        `${currentDevice?.name ?? "ui-device"}-${
          workingNotifyChar.serviceUuid
        }`,
      name: currentDevice?.name ?? deviceName,
      serviceUuid: workingNotifyChar.serviceUuid,
      readNotifyCharacteristicUuid: workingNotifyChar.uuid,
      writeCharacteristicUuid: writeCharacteristic.uuid,
    };

    try {
      await connectBluetooth(deviceForProvider);
      setIsStreaming(true);
      toast.success("Streaming started");
    } catch (err) {
      console.error("Provider connect failed:", err);
      toast.error("Failed to start streaming");
    }
  };

  // Stop streaming
  const handleStopStreaming = async () => {
    try {
      await disconnectBluetooth();
      setIsStreaming(false);
      toast.info("Streaming stopped");
    } catch (err) {
      console.error("Stop streaming failed:", err);
      toast.error("Failed to stop streaming");
    }
  };

  return (
    <div className="flex flex-col font-sm space-y-2 mb-5">
      {!localConnected ? (
        <Button
          onClick={scanForDevices}
          className="max-w-6xl w-60 cursor-pointer"
          disabled={isScanning || isDiscovering}
        >
          {isScanning || isDiscovering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isScanning ? "Scanning..." : "Discovering..."}
            </>
          ) : (
            <>
              <Bluetooth className="mr-2 h-4 w-4" />
              Scan for Devices
            </>
          )}
        </Button>
      ) : (
        <Button
          variant="destructive"
          onClick={handleDisconnect}
          className="max-w-6xl w-60  cursor-pointer"
        >
          <BluetoothOff className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      )}

      {/* Streaming toggle button */}
      {workingNotifyChar && writeCharacteristic && (
        <div className="mt-2">
          {isStreaming ? (
            <Button
              onClick={handleStopStreaming}
              className="max-w-6xl w-60 cursor-pointer transition hover:bg-red-100 hover:text-red-500 shadow-xs dark:text-red-400 dark:hover:text-red-500 hover:border-red-300  text-red-400"
              variant="outline"
            >
              <OctagonPause className="mr-2 h-4 w-4" />
              Stop Streaming
            </Button>
          ) : (
            <Button
              onClick={handleStartStreaming}
              className="max-w-6xl w-60 cursor-pointer"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Streaming
            </Button>
          )}
        </div>
      )}

      {/* Create device modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Would you like to add this new device to your collection?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Service UUID</Label>
              <div className="p-2 text-sm font-mono rounded">
                {workingNotifyChar?.serviceUuid || "Not found"}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notify Characteristic UUID</Label>
              <div className="p-2 text-sm font-mono rounded">
                {workingNotifyChar?.uuid || "Not found"}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Write Characteristic UUID</Label>
              <div className="p-2 text-sm font-mono rounded">
                {writeCharacteristic?.uuid || "Not found"}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateDevice}
              disabled={
                !workingNotifyChar || !writeCharacteristic || isCreating
              }
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Device"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BluetoothConnectButton;
