// app/(auth)/layout.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { ThemeProvider } from "@/hooks/theme-provider";
import { BluetoothSensorProvider } from "../../context/useBluetoothSensor";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BluetoothSensorProvider>
        <main className="">{children}</main>
      </BluetoothSensorProvider>
    </ThemeProvider>
  );
}
