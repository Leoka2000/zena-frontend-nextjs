"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import axios from "axios";
import { getToken } from "@/lib/auth";

interface ChartAreaInteractiveProps {
  status: string;
}

interface TemperatureDataPoint {
  date: string;
  temperature: number;
}

const chartConfig = {
  temperature: {
    label: "Temperature",
    color: "#fb7185",
  },
} satisfies ChartConfig;

const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

export const ChartLineInteractive = ({ status }: ChartAreaInteractiveProps) => {
  const [data, setData] = React.useState<TemperatureDataPoint[]>([]);
  const [range, setRange] = React.useState("day");
  const [deviceId, setDeviceId] = React.useState<number | null>(null);
  const [isPolling, setIsPolling] = React.useState(true);

  const statusColorClass =
    status === "Disconnected"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-300";

  const fetchActiveDevice = React.useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`https://api.zane.hu/api/device/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setDeviceId(res.data.deviceId);
    } catch (err) {
      console.error("Failed to fetch active device:", err);
    }
  }, []);

  const fetchTemperatureData = React.useCallback(async () => {
    if (!deviceId) return;

    try {
      const token = await getToken();
      const res = await axios.get<TemperatureDataPoint[]>(
        `https://api.zane.hu/api/temperature/history?range=${range}&deviceId=${deviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const newData = res.data
        .map(item => ({
          date: item.date, // use the date field directly
          temperature: item.temperature,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setData(newData);
    } catch (err) {
      console.error("Failed to fetch temperature data:", err);
    }
  }, [deviceId, range]);

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      fetchTemperatureData();
      intervalId = setInterval(fetchTemperatureData, 5000);
    };

    if (isPolling && deviceId) {
      startPolling();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchTemperatureData, isPolling, deviceId]);

  React.useEffect(() => {
    fetchActiveDevice();
  }, [fetchActiveDevice]);

  React.useEffect(() => {
    return () => {
      setIsPolling(false);
    };
  }, []);

  const stats = React.useMemo(() => {
    if (data.length === 0) return { current: null, average: null, min: null, max: null };

    const current = data[data.length - 1]?.temperature;
    const sum = data.reduce((acc, val) => acc + val.temperature, 0);
    const average = sum / data.length;
    const min = Math.min(...data.map(d => d.temperature));
    const max = Math.max(...data.map(d => d.temperature));

    return { current, average, min, max };
  }, [data]);

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex z-10 flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <CardTitle>Temperature Monitor</CardTitle>
          <p className="leading-4 text-sm py-1">
            <span className={`text-sm font-semibold ${statusColorClass}`}>{status}</span>
          </p>
        </div>
        <div className="flex flex-col justify-center gap-1 px-6 py-4">
          <label className="text-sm text-muted-foreground mb-1">Range:</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm capitalize">
                {ranges.find(r => r.value === range)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={range} onValueChange={setRange}>
                {ranges.map(r => (
                  <DropdownMenuRadioItem key={r.value} value={r.value}>
                    {r.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-lg font-bold">
              {stats.current !== null ? `${stats.current.toFixed(2)} °C` : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-lg font-bold">
              {stats.average !== null ? `${stats.average.toFixed(2)} °C` : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="text-lg font-bold">
              {stats.min !== null ? `${stats.min.toFixed(2)} °C` : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="text-lg font-bold">
              {stats.max !== null ? `${stats.max.toFixed(2)} °C` : "-"}
            </p>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="fillTemperature" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-temperature)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-temperature)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={["auto", "auto"]}
              tickFormatter={(value) => `${value}°C`}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                if (isNaN(date.getTime())) return "";
                return date.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="temperature"
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return isNaN(date.getTime())
                      ? "Invalid date"
                      : date.toLocaleString("en-GB", {
                          hour12: false,
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                  }}
                  valueFormatter={(val) => `${val} °C`}
                />
              }
            />
            <Area
              dataKey="temperature"
              type="monotone"
              fill="url(#fillTemperature)"
              stroke="var(--color-temperature)"
              strokeWidth={2}
              isAnimationActive={true}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
