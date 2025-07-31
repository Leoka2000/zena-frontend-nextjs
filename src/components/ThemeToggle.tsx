
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <Button
      variant="outline"
      size="sm"
      className="mx-1"

   
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <><Sun className="h-4 w-4" />  Light theme </> :  <> <Moon className="h-4 w-4" /> Dark theme </>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
