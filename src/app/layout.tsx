// app/layout.tsx or app/layout.ts

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../hooks/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Zane Systems",
  description: "Dashboard application",
   icons: {
    icon: "/icon.png", // 👈 This tells Next.js to use your PNG
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap"
          rel="stylesheet"
        />

          <link rel="icon" href="/zanelogo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   
      </head>

      <body>
        <ThemeProvider defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
