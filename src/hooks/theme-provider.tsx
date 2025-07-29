// components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"


export function ThemeProvider({ children, ...props }: React.ComponentProps<"div">) {
  return (
    <NextThemesProvider
      defaultTheme="system"
      attribute="class"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
