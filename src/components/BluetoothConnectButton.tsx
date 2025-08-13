import { Bluetooth, BluetoothOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

// Common BLE Service UUIDs (add your custom ones here)
const STANDARD_SERVICES: Record<string, string> = {
  '180A': 'Device Information',
  '180F': 'Battery Service',
  '181A': 'Environmental Sensing',
  '1811': 'Alert Notification',
  // Add your custom services
  '1234': 'Custom Service 1',
  '5678': 'Custom Service 2'
};

// Common Characteristic Properties
const CHARACTERISTIC_PROPERTIES: Record<string, string> = {
  read: 'Read',
  write: 'Write',
  notify: 'Notify',
  indicate: 'Indicate',
  broadcast: 'Broadcast',
  writeWithoutResponse: 'WriteWithoutResponse'
};

const BluetoothConnectButton = () => {
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [localConnected, setLocalConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<BluetoothDevice | null>(null);
  const [notifyCharacteristic, setNotifyCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [writeCharacteristic, setWriteCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  // Add your known service UUIDs here
  const KNOWN_SERVICES = [
    "0000180a-0000-1000-8000-00805f9b34fb", // Device Information Service
    "11111111-1111-1111-1111-111111111111", // Example custom service
    "22222222-2222-2222-2222-222222222222"  // Another custom service
  ];

  const discoverServicesAndCharacteristics = async (device: BluetoothDevice) => {
    try {
      setIsDiscovering(true);
      toast.info("Discovering services...");
      
      if (!device.gatt) throw new Error("GATT server not available");

      const server = await device.gatt.connect();
      console.log("Connected to GATT server");

      // Get all primary services
      const services = await server.getPrimaryServices();
      console.log(`Found ${services.length} primary services`);

      for (const service of services) {
        // Get short UUID (last 4 digits)
        const shortUuid = service.uuid.split('-')[0].slice(-4);
        const serviceName = STANDARD_SERVICES[shortUuid] || 'Unknown Service';
        
        console.group(`%c${serviceName}`, 'color: #4CAF50; font-weight: bold');
        console.log(`Full UUID: ${service.uuid}`);
        
        // Get all characteristics
        const characteristics = await service.getCharacteristics();
        console.log(`Found ${characteristics.length} characteristics:`);

        for (const characteristic of characteristics) {
          const charShortUuid = characteristic.uuid.split('-')[0].slice(-4);
          const props = Object.entries(characteristic.properties)
            .filter(([_, value]) => value)
            .map(([key]) => CHARACTERISTIC_PROPERTIES[key] || key)
            .join(', ');

          console.groupCollapsed(
            `%cCharacteristic: ${charShortUuid}`,
            'color: #2196F3'
          );
          console.log(`Full UUID: ${characteristic.uuid}`);
          console.log(`Properties: ${props}`);
          
          // Identify and store important characteristics
          if (characteristic.properties.notify) {
            console.log('🔔 NOTIFY characteristic');
            setNotifyCharacteristic(characteristic);
          }
          
          if (characteristic.properties.write) {
            console.log('✏️ WRITE characteristic');
            setWriteCharacteristic(characteristic);
          }
          
          if (characteristic.properties.read) {
            console.log('📖 READ characteristic');
          }
          
          console.groupEnd();
        }
        console.groupEnd();
      }

      toast.success("Service discovery complete");
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
      setNotifyCharacteristic(null);
      setWriteCharacteristic(null);
      toast.info("Scanning for BLE devices...");

      // Request Bluetooth access with service UUIDs
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_SERVICES
      });

      if (!device) throw new Error("No device selected");

      console.log("Selected device:", device);
      setAvailableDevices([device]);
      setCurrentDevice(device);

      // Connect to GATT server
      if (device.gatt) {
        await device.gatt.connect();
        setLocalConnected(true);
        await discoverServicesAndCharacteristics(device);
      } else {
        throw new Error("Device doesn't support GATT");
      }
    } catch (error) {
      console.error("Scan error:", error);
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotFoundError':
            toast.error("No devices found");
            break;
          case 'SecurityError':
            toast.error("Permissions denied. Try adding service UUIDs to optionalServices");
            break;
          case 'NotAllowedError':
            toast.error("Access cancelled");
            break;
          default:
            toast.error("Bluetooth error occurred");
        }
      } else {
        toast.error("Connection failed");
      }
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
    setNotifyCharacteristic(null);
    setWriteCharacteristic(null);
    toast.info("Disconnected from device");
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
            <Bluetooth className="mr-2 h-4 w-4" />
            {isScanning ? "Scanning..." : 
             isDiscovering ? "Discovering..." : "Scan for Devices"}
          </Button>
          
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
        <div className="space-y-4">
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            className="max-w-3xs cursor-pointer w-full"
          >
            <BluetoothOff className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
          
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium mb-2">Discovered Characteristics:</h3>
            {notifyCharacteristic && (
              <div className="text-sm mb-2">
                <span className="font-medium">🔔 Notify:</span> {notifyCharacteristic.uuid}
              </div>
            )}
            {writeCharacteristic && (
              <div className="text-sm">
                <span className="font-medium">✏️ Write:</span> {writeCharacteristic.uuid}
              </div>
            )}
            {!notifyCharacteristic && !writeCharacteristic && (
              <div className="text-sm text-gray-500">No special characteristics found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BluetoothConnectButton;