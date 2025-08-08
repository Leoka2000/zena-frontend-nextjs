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
import { TrendingDown, TrendingUp } from "lucide-react";
import { CredentialsCard } from "../dashboard-cards/CredentialsCard";
import { TimestampCard } from "../dashboard-cards/TimestampCard";
import { TemperatureCard } from "../dashboard-cards/TemperatureCard";
import { AccelerometerCard } from "../dashboard-cards/AccelerometerCard";

export function BottomCardsSection() {
  return (
    <>
      <div className="flex flex-col gap-2 py-2 pb-4 md:gap-6">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          <CredentialsCard />
          <TemperatureCard />
          <AccelerometerCard />
        </div>
      </div>
    </>
  );
}
