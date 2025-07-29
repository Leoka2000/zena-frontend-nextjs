"use client"

import { useState } from "react"
import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Loader2Icon } from "lucide-react"

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleLogout} disabled={loading}>
      {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? "Logging out..." : "Logout"}
    </Button>
  )
}
