"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { LogoutButton } from "@/components/LogoutButton"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
    }
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
      <LogoutButton />
      <ThemeToggle />
    </div>
  )
}
