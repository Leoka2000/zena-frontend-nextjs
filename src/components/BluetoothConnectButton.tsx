import { Bluetooth, BluetoothOff } from "lucide-react";
import { useBluetoothSensor } from "../context/useBluetoothSensor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

const BluetoothConnectButton = () => {
  const { isConnected, connectBluetooth, disconnectBluetooth, selectedDevice } =
    useBluetoothSensor();

  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
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

  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      setAvailableDevices([]);
      toast.info("Scanning for BLE devices...");

      // Request Bluetooth access
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [] // You can specify services here if needed
      });

      // When device is selected
      if (device) {
        // Log device information including service UUIDs
        console.log('Bluetooth Device Info:', {
          id: device.id,
          name: device.name,
          gatt: device.gatt,
          // Service UUIDs would be available after connecting
        });

        // Connect to the selected device
        await connectBluetooth();
        setAvailableDevices([device]);

        // After connection, get GATT server and services
        if (device.gatt) {
          const server = await device.gatt.connect();
          console.log('Connected to GATT server');
          
          // Get primary services
          const services = await server.getPrimaryServices();
          console.log('Available Service UUIDs:');
          services.forEach(service => {
            console.log(`- ${service.uuid}`);
          });
          
          // You might want to store these services in state
          // setServices(services);
        }
      }
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotFoundError') {
          toast.error("No Bluetooth devices found");
        } else if (error.name === 'SecurityError') {
          toast.error("Bluetooth permissions denied");
        } else if (error.name === 'NotAllowedError') {
          toast.error("Bluetooth access was cancelled");
        }
      } else {
        toast.error("Error scanning for devices");
        console.error("Bluetooth scan error:", error);
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col font-sm space-y-2 mb-5">
      {!localConnected ? (
        <>
          <Button
            onClick={scanForDevices}
            className="max-w-3xs cursor-pointer"
            disabled={isScanning}
          >
            <Bluetooth className="mr-2 h-4 w-4" />
            {isScanning ? "Scanning..." : "Scan for Bluetooth Devices"}
          </Button>
          
          {/* Display found devices */}
          {availableDevices.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium">Available Devices:</h3>
              <ul className="space-y-1">
                {availableDevices.map((device) => (
                  <li key={device.id} className="text-sm">
                    {device.name || 'Unknown Device'} ({device.id})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
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