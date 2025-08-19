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
import { Heater, ThermometerSun } from "lucide-react";
import { useBluetoothSensor } from "../../context/useBluetoothSensor";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { formatElapsedTime, getToken } from "@/lib/utils"; // assuming getToken exists to add JWT

export function TemperatureCard() {
  const { lastUpdateTimestamp, temperatureData } = useBluetoothSensor();
  const [elapsed, setElapsed] = useState("");
  const [previousTemperature, setPreviousTemperature] = useState<number | null>(null);
  const [temperatureChange, setTemperatureChange] = useState<number | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  // Fetch the latest historical temperature when component mounts
  useEffect(() => {
    const fetchLatestTemperature = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/api/temperatures/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);

        const history = await res.json();

        if (Array.isArray(history) && history.length > 0) {
          // Sort by createdAt descending
          const latest = history.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          setPreviousTemperature(latest.temperature);
        }
      } catch (err) {
        console.error("Error fetching latest temperature:", err);
      }
    };

    fetchLatestTemperature();
  }, []);

  // Elapsed time updater
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

  // Calculate change when new temperature comes in
  useEffect(() => {
    if (temperatureData?.temperature && previousTemperature !== null && previousTemperature !== 0) {
      const change =
        ((temperatureData.temperature - previousTemperature) / previousTemperature) * 100;
      setTemperatureChange(change);
      setPreviousTemperature(temperatureData.temperature);
    }
  }, [temperatureData, previousTemperature]);

  const getChangeIndicator = () => {
    if (temperatureChange === null || previousTemperature === null) return null;

    const isIncreasing = temperatureChange >= 0;
    const changeText = `${Math.abs(temperatureChange).toFixed(1)}%`;

    return (
      <div className="line-clamp-1 flex gap-2 text-xs items-center">
        Temperature has {isIncreasing ? "increased" : "decreased"} by {changeText}
        {isIncreasing ? (
          <TrendingUp className="size-4 text-green-500" />
        ) : (
          <TrendingDown className="size-4 text-red-500" />
        )}
      </div>
    );
  };

  return (
    <Card className="@container/card transition-transform duration-300 ease-in-out hover:-translate-y-1.5 hover:cursor-pointer hover:bg-gray-100">
      <CardHeader>
        <CardDescription>Temperature received</CardDescription>
        <CardTitle className="text-2xl font-semibold text-[#fb7185] tabular-nums @[250px]/card:text-3xl">
          {temperatureData?.temperature
            ? `${temperatureData.temperature.toFixed(1)}°C`
            : previousTemperature !== null
            ? `${previousTemperature.toFixed(1)}°C`
            : "No data yet"}
        </CardTitle>
        <CardAction>
             <span className="flex bg-neutral-50 shadow-sm text-gray-500 text-xs font-medium me-2 px-2 py-1 rounded-lg dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 border dark:border-neutral-700">
            <ThermometerSun size={25} strokeWidth={1.2} />
      
              </span>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-xs">
        {getChangeIndicator()}
        <div className="text-muted-foreground">
          Time elapsed since last update: <br />
          {elapsed}
        </div>
      </CardFooter>
    </Card>
  );
}
