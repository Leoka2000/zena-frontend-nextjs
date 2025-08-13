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
     
          <CredentialsCard />
      
      
    </>
  );
}
