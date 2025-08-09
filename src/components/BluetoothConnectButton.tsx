import { Bluetooth, BluetoothOff } from "lucide-react";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

const BluetoothConnectButton = () => {
  const { isConnected, connectBluetooth, disconnectBluetooth, selectedDevice } =
    useBluetoothSensor();

  const prevConnected = useRef(isConnected);
  const prevSelectedDevice = useRef(selectedDevice);
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

  useEffect(() => {
    if (prevSelectedDevice.current !== selectedDevice) {
      setLocalConnected(false);
      prevSelectedDevice.current = selectedDevice;
    }
  }, [selectedDevice]);

  // New handler wrapping connectBluetooth with error handling
  const handleConnectBluetooth = async () => {
    try {
      await connectBluetooth();
    } catch (error: any) {
      // Check if error message matches invalid service name error
      if (
        error instanceof TypeError &&
        error.message.includes("Invalid Service name")
      ) {
        toast.error(
          "Credentials in incorrect form! Make sure to edit your credentials in order to connect successfully"
        );
      } else {
        // For other errors, you may want to log or toast generically
        toast.error("Failed to connect to Bluetooth device.");
        console.error(error);
      }
    }
  };

  return (
    <div className="flex flex-col font-sm space-y-2 mb-5">
      {!localConnected ? (
        <Button
          onClick={handleConnectBluetooth}
          className="max-w-3xs cursor-pointer"
          disabled={!selectedDevice}
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
