"use client";

import React, { useState } from "react";
import { Bluetooth, BluetoothOff, Loader2, Play } from "lucide-react";
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

const BluetoothConnectButton = () => {
  const { connectBluetooth, disconnectBluetooth, isDeviceConnected } =
    useBluetoothSensor();

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

  // Test characteristic by trying read or notifications
  const testCharacteristic = async (
    characteristic: BluetoothRemoteGATTCharacteristic
  ) => {
    try {
      // try read
      await characteristic.readValue();
      return true;
    } catch (readError) {
      // ignore read failure
    }

    try {
      // try notifications
      await characteristic.startNotifications();
      await characteristic.stopNotifications();
      return true;
    } catch (notifyError) {
      // ignore notify failure
    }

    return false;
  };

  const discoverServicesAndCharacteristics = async (device: BluetoothDevice) => {
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

      // test notify chars to pick a working one
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

      // Use acceptAllDevices to improve discoverability and ask for optional services
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
    } catch (error: any) {
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
    toast.info("Disconnected from device");
  };

  // Called when the user chooses to create the device record in backend
  const handleCreateDevice = async () => {
    if (!workingNotifyChar || !writeCharacteristic || !currentDevice) return;

    try {
      setIsCreating(true);
      const response = await fetch(
        "http://localhost:8080/api/device/create-from-bluetooth",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({
            name: deviceName,
            serviceUuid: workingNotifyChar.serviceUuid,
            // backend may expect 'notifyCharacteristicUuid' — we'll keep that name for creation
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
    } catch (error: any) {
      console.error("Create error:", error);
      toast.error(error.message || "Failed to create device");
    } finally {
      setIsCreating(false);
    }
  };

  // NEW: connect through provider so provider will handle notifications + writes + backend posts
  const handleConnectViaProvider = async () => {
    if (!workingNotifyChar || !writeCharacteristic) {
      toast.error("Missing notify or write characteristic");
      return;
    }

    // Build Device shape expected by provider
    const deviceForProvider = {
      id:
        currentDevice?.id ||
        `${currentDevice?.name ?? "ui-device"}-${workingNotifyChar.serviceUuid}`,
      name: currentDevice?.name ?? deviceName,
      serviceUuid: workingNotifyChar.serviceUuid,
      readNotifyCharacteristicUuid: workingNotifyChar.uuid,
      writeCharacteristicUuid: writeCharacteristic.uuid,
    };

    try {
      await connectBluetooth(deviceForProvider);
      toast.success("Connected and streaming via provider");
    } catch (err) {
      console.error("Provider connect failed:", err);
      toast.error("Failed to connect via provider");
    }
  };

  return (
    <div className="flex flex-col font-sm space-y-2 mb-5">
      {!localConnected ? (
        <>
          <Button
            onClick={scanForDevices}
            className="max-w-3xs cursor-pointer"
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
        </>
      ) : (
        <Button
          variant="destructive"
          onClick={handleDisconnect}
          className="max-w-3xs cursor-pointer"
        >
          <BluetoothOff className="" />
          Disconnect
        </Button>
      )}

      {/* Show a connect-via-provider button once we have discovered working characteristics */}
      {workingNotifyChar && writeCharacteristic && (
        <div className="mt-2">
          <Button onClick={handleConnectViaProvider} className="w-64">
            <Play />
          Start Streaming
          </Button>
        </div>
      )}

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
              <div className="p-2 text-sm font-mono  rounded">
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
              disabled={!workingNotifyChar || !writeCharacteristic || isCreating}
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
