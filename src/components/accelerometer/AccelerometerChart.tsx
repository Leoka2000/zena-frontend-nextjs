"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getToken } from "@/lib/auth";

interface AccelerometerDataPoint {
  date: string;
  x: number | null;
  y: number | null;
  z: number | null;
}

interface AccelerometerChartProps {
  status: string;
}

const chartConfig = {
  x: { label: "X Axis", color: "var(--chart-1)" },
  y: { label: "Y Axis", color: "var(--chart-2)" },
  z: { label: "Z Axis", color: "var(--chart-3)" },
};

const ranges = [
  { label: "Last 24 hours", value: "day" },
  { label: "Last 7 days", value: "week" },
  { label: "Last 30 days", value: "month" },
  { label: "Last 3 months", value: "3months" },
];

export const AccelerometerChart = ({ status }: AccelerometerChartProps) => {
  const [data, setData] = React.useState<AccelerometerDataPoint[]>([]);
  const [range, setRange] = React.useState("day");
  const [deviceId, setDeviceId] = React.useState<number | null>(null);

  const statusColorClass =
    status === "Disconnected"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-300";

  // Fetch active device once
  React.useEffect(() => {
    const fetchActiveDevice = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`https://api.zane.hu/api/device/active`, {
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

  // Function to fetch accelerometer history
  const fetchAccelerometerData = React.useCallback(
    async (selectedRange: string, activeDeviceId: number) => {
      try {
        const token = await getToken();
        const res = await fetch(
          `https://api.zane.hu/api/accelerometer/history?range=${selectedRange}&deviceId=${activeDeviceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch accelerometer data");
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

    fetchAccelerometerData(range, deviceId);

    const interval = setInterval(() => {
      fetchAccelerometerData(range, deviceId);
    }, 5000);

    return () => clearInterval(interval);
  }, [deviceId, range, fetchAccelerometerData]);

  const stats = React.useMemo(() => {
    if (!data.length) return { current: null };
    const latest = data[data.length - 1];
    return {
      current: latest ? { x: latest.x, y: latest.y, z: latest.z } : null,
    };
  }, [data]);

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex z-10 flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 py-4 mb-4 px-6 pb-3 sm:pb-0">
          <CardTitle>Accelerometer</CardTitle>
          <p className="leading-4 text-sm py-1">
            <span className={`text-sm font-semibold ${statusColorClass}`}>
              {status}
            </span>
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
        <div className="grid grid-cols-3 gap-3 mb-4">
          {stats.current && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">X</p>
                <p className="text-lg font-bold">{stats.current.x?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Y</p>
                <p className="text-lg font-bold">{stats.current.y?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Z</p>
                <p className="text-lg font-bold">{stats.current.z?.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
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
            <YAxis />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[180px]"
                  labelFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return "Invalid date";
                    }
                  }}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="x"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="z"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
