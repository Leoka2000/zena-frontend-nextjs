"use client";
import { useEffect, useState } from "react";
import { formatElapsedTime } from "@/lib/utils";

interface TimeElapsedProps {
  lastUpdateTimestamp: number | null;
  prefix?: string;
  className?: string;
}

export function TimeElapsed({ 
  lastUpdateTimestamp, 
  prefix = "Time elapsed since last update:", 
  className = "text-sm " 
}: TimeElapsedProps) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!lastUpdateTimestamp) {
      setElapsed("No updates yet");
      return;
    }

    const updateElapsed = () => {
      const secondsPassed = Math.floor(Date.now() / 1000) - lastUpdateTimestamp;
      setElapsed(formatElapsedTime(secondsPassed));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTimestamp]);

  return (
    <div className={`text-muted-foreground ${className}`}>
      {prefix} <br/>{elapsed}
    </div>
  );
}