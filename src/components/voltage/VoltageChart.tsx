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

interface VoltageChartProps {
  voltage: number | null;
  timestamp: number | null;
  status: string;
}

interface VoltageDataPoint {
  date: string;
  voltage: number | null;
  timestamp: number | null;
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

export const VoltageChart = ({
  voltage,
  timestamp,
  status,
}: VoltageChartProps) => {
  const [data, setData] = React.useState<VoltageDataPoint[]>([]);
  const [range, setRange] = React.useState("day");

  const statusColorClass =
    status === "Disconnected"
      ? "text-red-600 dark:text-red-400"
      : "text-green-600 dark:text-green-300";

  const fetchHistoricalData = React.useCallback(async (selectedRange: string) => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `http://localhost:8080/api/voltage/history?range=${selectedRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch voltage history:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchHistoricalData(range);
  }, [range, fetchHistoricalData]);

  // Update with real-time data
  React.useEffect(() => {
    if (voltage !== null && timestamp !== null) {
      setData(prev => {
        const newPoint = {
          date: new Date(timestamp * 1000).toISOString(),
          voltage,
          timestamp
        };
        
        const existingIndex = prev.findIndex(d => d.timestamp === timestamp);
        
        if (existingIndex >= 0) {
          const newData = [...prev];
          newData[existingIndex] = newPoint;
          return newData;
        } else {
          return [...prev, newPoint].sort(
            (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      )}
      });
    }
  }, [voltage, timestamp]);

 
  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex z-10 flex-col items-stretch border-b !p-0 sm:flex-row">
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
                const date = new Date(value);
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
                  nameKey="voltage"
                  labelFormatter={(value) =>
                    new Date(value).toLocaleString("en-GB", {
                      hour12: false,
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
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