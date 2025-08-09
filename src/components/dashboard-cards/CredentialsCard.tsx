"use client";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletCards } from "lucide-react";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function CredentialsCard() {
  const {
    serviceUuid,
    readNotifyCharacteristicUuid,
    writeCharacteristicUuid,
  } = useBluetoothSensor();

  const [form, setForm] = useState({
    serviceUuid,
    readNotifyCharacteristicUuid,
    writeCharacteristicUuid,
  });

  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="@container/card transition-transform duration-300 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer hover:bg-gray-100">
          <CardHeader>
            <CardDescription>Bluetooth Device</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              Credentials:
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="py-2 shadow-md">
                <WalletCards />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex flex-col gap-1 font-mono">
              <div className="text-xs text-muted-foreground">
                <strong className="text-xs">Service UUID:</strong> {serviceUuid}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong className="text-xs">Notify UUID:</strong>{" "}
                {readNotifyCharacteristicUuid}
              </div>
              <div className="text-xs text-muted-foreground">
                <strong className="text-xs">Write UUID:</strong>{" "}
                {writeCharacteristicUuid}
              </div>
            </div>
          </CardFooter>
        </Card>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Bluetooth Credentials</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceUuid">Service UUID</Label>
              <Input
                id="serviceUuid"
                name="serviceUuid"
                value={form.serviceUuid}
                onChange={handleChange}
                placeholder="Enter service UUID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="readNotifyCharacteristicUuid">Notify Characteristic UUID</Label>
              <Input
                id="readNotifyCharacteristicUuid"
                name="readNotifyCharacteristicUuid"
                value={form.readNotifyCharacteristicUuid}
                onChange={handleChange}
                placeholder="Enter notify characteristic UUID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="writeCharacteristicUuid">Write Characteristic UUID</Label>
              <Input
                id="writeCharacteristicUuid"
                name="writeCharacteristicUuid"
                value={form.writeCharacteristicUuid}
                onChange={handleChange}
                placeholder="Enter write characteristic UUID"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}