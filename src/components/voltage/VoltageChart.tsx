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
import { getToken } from "@/lib/auth";

interface VoltageChartProps {
  status: string;
}

interface VoltageDataPoint {
  date: string;
  voltage: number | null;
}

const chartConfig = {
  voltage: {
    label: "Voltage",
    color: "#fcd34d",
  },
} satisfies ChartConfig;

const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

export const VoltageChart = ({ status }: VoltageChartProps) => {
  const [data, setData] = React.useState<VoltageDataPoint[]>([]);
  const [range, setRange] = React.useState("day");
  const [deviceId, setDeviceId] = React.useState<number | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const statusColorClass =
    status === "Disconnected"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-300";

  // Fetch active device once
  React.useEffect(() => {
    const fetchActiveDevice = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/device/active`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch active device");
        const body = await res.json();
        setDeviceId(body.deviceId);
      } catch (err) {
        console.error(err);
      }
    };
    fetchActiveDevice();
  }, []);

  // Function to fetch voltage history
  const fetchHistoricalData = React.useCallback(
    async (selectedRange: string, activeDeviceId: number) => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE_URL}/api/voltage/history?range=${selectedRange}&deviceId=${activeDeviceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch voltage history");
        const body = await res.json();
        setData(body);
      } catch (err) {
        console.error(err);
      }
    },
    []
  );

  // Fetch initially + poll every 5 seconds
  React.useEffect(() => {
    if (deviceId === null) return;

    // Initial fetch
    fetchHistoricalData(range, deviceId);

    // Poll every 5s
    const interval = setInterval(() => {
      fetchHistoricalData(range, deviceId);
    }, 5000);

    return () => clearInterval(interval);
  }, [deviceId, range, fetchHistoricalData]);

  const stats = React.useMemo(() => {
    const valid = data.filter((d) => d.voltage !== null) as {
      voltage: number;
    }[];
    if (!valid.length) return { current: null, min: null, max: null };
    const current = valid[valid.length - 1]?.voltage;
    const min = Math.min(...valid.map((d) => d.voltage));
    const max = Math.max(...valid.map((d) => d.voltage));
    return { current, min, max };
  }, [data]);

  return (
    <Card className="py-4 sm:py-0 ">
      <CardHeader className="flex z-10 flex-col items-stretch border-b border-b-neutral-200 dark:border-b-neutral-800 !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <CardTitle>Battery Voltage</CardTitle>
          <div className="flex items-center justify-between">
            <p className="leading-4 text-sm py-1">
              <span className={`text-sm font-semibold ${statusColorClass}`}>
                {status}
              </span>
            </p>
            
          </div>
        </div>

        <div className="flex flex-col justify-center gap-1 px-6 py-4">
          <label className="text-sm text-muted-foreground mb-1">Range:</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm capitalize">
                {ranges.find((r) => r.value === range)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={range} onValueChange={setRange}>
                {ranges.map((r) => (
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
        <div className="grid grid-cols-3 gap-3 mb-4">
         
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="fillVoltage" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-voltage)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-voltage)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={["auto", "auto"]}
              tickFormatter={(value) => `${value}V`}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                try {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) return "";
                  return date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } catch {
                  return "";
                }
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="voltage"
                  labelFormatter={(value) => {
                    try {
                      const date = new Date(value);
                      if (isNaN(date.getTime())) return "Invalid date";
                      return date.toLocaleString("en-GB", {
                        hour12: false,
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return "Invalid date";
                    }
                  }}
                  valueFormatter={(val) => `${val} V`}
                />
              }
            />
            <Area
              dataKey="voltage"
              type="monotone"
              fill="url(#fillVoltage)"
              stroke="var(--color-voltage)"
              strokeWidth={2}
              isAnimationActive={true}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
