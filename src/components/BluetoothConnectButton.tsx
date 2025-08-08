import { Bluetooth, BluetoothOff } from "lucide-react";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

const BluetoothConnectButton = () => {
  const { isConnected, connectBluetooth, disconnectBluetooth, selectedDevice } =
    useBluetoothSensor();

  // Track previous connection state to detect changes and show toast
  const prevConnected = useRef(isConnected);
  // Track previous selected device to reset connection UI on device change
  const prevSelectedDevice = useRef(selectedDevice);

  // Local state to force UI update for connection status on selectedDevice change
  const [localConnected, setLocalConnected] = useState(isConnected);

  useEffect(() => {
    if (prevConnected.current !== isConnected) {
      if (isConnected) {
        toast.success("Connected to Bluetooth device", {
          description: "Connection successful.",
        });
      } else {
        toast.error("Disconnected from Bluetooth device", {
          description: "Device has been disconnected.",
        });
      }
      prevConnected.current = isConnected;
      setLocalConnected(isConnected);
    }
  }, [isConnected]);

  // When selectedDevice changes, reset localConnected to false
  useEffect(() => {
    if (prevSelectedDevice.current !== selectedDevice) {
      // Disconnect is already triggered by context, but UI needs to reflect immediately
      setLocalConnected(false);
      prevSelectedDevice.current = selectedDevice;
    }
  }, [selectedDevice]);

  return (
    <div className="flex flex-col font-sm space-y-2">
      {!localConnected ? (
        <Button
          onClick={connectBluetooth}
          className="max-w-3xs cursor-pointer"
          disabled={!selectedDevice} // disable button if no device selected
          title={!selectedDevice ? "Select a device first" : undefined}
        >
          <Bluetooth className="mr-2 h-4 w-4" />
          Connect to Bluetooth Device
        </Button>
      ) : (
        <Button
          variant="destructive"
          onClick={disconnectBluetooth}
          className="max-w-3xs cursor-pointer"
        >
          <BluetoothOff className="mr-2 h-4 w-4" />
          Disconnect
        </Button>
      )}
    </div>
  );
};

export default BluetoothConnectButton;
