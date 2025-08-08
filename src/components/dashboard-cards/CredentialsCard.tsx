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
import { useBluetoothSensor } from "../../context/useBluetoothSensor"; // adjust path as needed
import { TrendingDown, TrendingUp } from "lucide-react";

export function CredentialsCard() {
  const {
    SERVICE_UUID,
    READ_NOTIFY_CHARACTERISTIC_UUID,
    WRITE_CHARACTERISTIC_UUID,
  } = useBluetoothSensor();

  return (
    <>
      <Card className="@container/card">
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
          <div className="flex flex-col gap-1 font-mono ">
            <div className="text-xs text-muted-foreground ">
              <strong className="text-xs">Service UUID:</strong> {SERVICE_UUID}
            </div>
            <div className="text-xs text-muted-foreground ">
              <strong className="text-xs">Notify UUID:</strong>
              {READ_NOTIFY_CHARACTERISTIC_UUID}
            </div>
            <div className="text-xs text-muted-foreground ">
              <strong className="text-xs">Write UUID:</strong>
              {WRITE_CHARACTERISTIC_UUID}
            </div>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
