"use client";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineSquiggle, Move3D } from "lucide-react";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";
import { useEffect, useState } from "react";
import { formatElapsedTime } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AccelerometerRecord {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  createdAt: string;
}

export function AccelerometerCard() {
  const { lastUpdateTimestamp, accelerometerData } = useBluetoothSensor();
  const [elapsed, setElapsed] = useState("");
  const [previousData, setPreviousData] = useState<AccelerometerRecord | null>(
    null
  );
  const [changes, setChanges] = useState({
    x: null as number | null,
    y: null as number | null,
    z: null as number | null,
  });

  // Fetch the latest stored accelerometer record from backend on mount
  useEffect(() => {
    const fetchLatestAccelerometer = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/accelerometer/history");
        if (!res.ok) throw new Error("Failed to fetch accelerometer history");
        const data: AccelerometerRecord[] = await res.json();
        if (data.length > 0) {
          // Assuming latest record is last in the array
          const latest = data[data.length - 1];
          setPreviousData(latest);
        }
      } catch (error) {
        console.error("Error fetching latest accelerometer data:", error);
      }
    };

    fetchLatestAccelerometer();
  }, []);

  // Update elapsed time display
  useEffect(() => {
    if (!lastUpdateTimestamp) return;

    const updateElapsed = () => {
      const secondsPassed = Math.floor(Date.now() / 1000) - lastUpdateTimestamp;
      setElapsed(formatElapsedTime(secondsPassed));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTimestamp]);

  // Calculate change percentages compared to previous data
  useEffect(() => {
    if (accelerometerData) {
      if (previousData) {
        const newChanges = {
          x:
            previousData.x !== 0
              ? ((accelerometerData.x - previousData.x) /
                  Math.abs(previousData.x)) *
                100
              : null,
          y:
            previousData.y !== 0
              ? ((accelerometerData.y - previousData.y) /
                  Math.abs(previousData.y)) *
                100
              : null,
          z:
            previousData.z !== 0
              ? ((accelerometerData.z - previousData.z) /
                  Math.abs(previousData.z)) *
                100
              : null,
        };
        setChanges(newChanges);
      }
      setPreviousData(accelerometerData);
    }
  }, [accelerometerData, previousData]);

  const getChangeIndicator = (axis: "x" | "y" | "z") => {
    const change = changes[axis];
    if (change === null || previousData === null) return null;

    const isIncreasing = change >= 0;
    const changeText = `${Math.abs(change).toFixed(1)}%`;

    return (
      <div className="flex gap-1 items-center">
        {axis.toUpperCase()}:{" "}
        {isIncreasing ? (
          <TrendingUp className="size-3 text-green-500" />
        ) : (
          <TrendingDown className="size-3 text-red-500" />
        )}
        <span>{changeText}</span>
      </div>
    );
  };

  const renderAxisValue = (axis: "x" | "y" | "z") => {
    const currentValue = accelerometerData?.[axis] ?? previousData?.[axis];
    return currentValue !== undefined ? currentValue.toFixed(2) : "--";
  };

  return (
    <Card className="@container/card transition-transform duration-300 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer hover:bg-gray-100">
      <CardHeader>
        <CardDescription>Accelerometer data</CardDescription>
        <CardTitle className="text-2xl font-semibold text-[#818cf8] tabular-nums @[250px]/card:text-3xl">
          {accelerometerData
            ? "Live data"
            : previousData
            ? "Last known data"
            : "No data yet"}
        </CardTitle>
        <div className="flex items-start gap-2 mt-5">
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground">X</span>
            <span className="text-base">{renderAxisValue("x")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground">Y</span>
            <span className="text-base">{renderAxisValue("y")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-muted-foreground">Z</span>
            <span className="text-base">{renderAxisValue("z")}</span>
          </div>
        </div>
        <CardAction>
          <span className="flex bg-neutral-100 shadow-md text-gray-500 text-xs font-medium me-2 px-2 py-1 rounded-lg dark:bg-neutral-800 dark:text-neutral-400 border dark:border-neutral-700">
            <LineSquiggle size={25} strokeWidth={0.75} />
          </span>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-xs">
        <div className="grid grid-cols-3 gap-2 w-full">
          {getChangeIndicator("x")}
          {getChangeIndicator("y")}
          {getChangeIndicator("z")}
        </div>
        <div className="text-muted-foreground">
          Time elapsed since last update: <br />
          {elapsed}
        </div>
      </CardFooter>
    </Card>
  );
}
