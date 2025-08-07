// components/BluetoothConnectButton.tsx
import { Bluetooth, BluetoothOff } from "lucide-react";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

const BluetoothConnectButton = () => {
  const { isConnected, connectBluetooth, disconnectBluetooth } =
    useBluetoothSensor();

  // Track previous connection state to detect changes
  const prevConnected = useRef(isConnected);

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
    }
  }, [isConnected]);

  return (
    <div className="flex flex-col font-sm space-y-2">
      {!isConnected ? (
        <Button
          onClick={connectBluetooth}
          className="max-w-3xs cursor-pointer"
        >
          <Bluetooth className="mr-2  h-4 w-4" />
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
