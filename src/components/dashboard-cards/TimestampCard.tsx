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
import { Hourglass, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { formatElapsedTime, getToken } from "@/lib/utils";

export function TimestampCard() {
  const [elapsed, setElapsed] = useState("");
  const [formattedTime, setFormattedTime] = useState("Loading...");

  // Fetch latest timestamp from backend
  useEffect(() => {
    async function fetchLatestTimestamp() {
      try {
        const token = getToken();
        if (!token) {
          setFormattedTime("No token — please log in");
          return;
        }

        const res = await fetch("https://api.zane.hu/api/temperature/history", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch temperature history");

        const data = await res.json();
        if (data.length > 0) {
          const latestEntry = data[0]; // Assuming newest first
          const createdAt = new Date(latestEntry.createdAt);
          setFormattedTime(createdAt.toLocaleTimeString());

          const secondsPassed = Math.floor((Date.now() - createdAt.getTime()) / 1000);
          setElapsed(formatElapsedTime(secondsPassed));
        } else {
          setFormattedTime("No data available");
        }
      } catch (err) {
        console.error(err);
        setFormattedTime("Error loading timestamp");
      }
    }

    fetchLatestTimestamp();
    const interval = setInterval(fetchLatestTimestamp, 60000); // refresh every min
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Last update</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {formattedTime}
        </CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className="py-2 shadow-md flex gap-2 items-center"
          >
            <Hourglass className="w-4 h-4" />
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        {elapsed && (
          <div className="text-muted-foreground">
            Time elapsed since last update: {elapsed}
          </div>
        )}
        <div className="text-muted-foreground mt-5 text-xs flex items-center gap-2">
          <Info size={25} /> Device usually sends a signal every 24 hours. If
          more time has elapsed, check the connection.
        </div>
      </CardFooter>
    </Card>
  );
}
