// components/LogoutButton.tsx

"use client"

import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <Button variant="destructive" onClick={logout}>
      Logout
    </Button>
  )
}
