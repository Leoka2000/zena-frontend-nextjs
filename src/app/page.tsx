"use client"
import Image from "next/image"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { createClient } from '@/utils/supabase/server'

import { getToken } from "@/lib/auth"
import { ThemeToggle } from "@/components/ThemeToggle"


export default function Home() {
   const [checkedAuth, setCheckedAuth] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      console.warn("No token found in local storage.")
    } else {
      console.log("Bearer token:", token)
    }
    setCheckedAuth(true)
  })
  
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-6 row-start-2 items-center sm:items-start">
        <h1 className="text-3xl font-bold text-center sm:text-left">Welcome</h1>
        <ThemeToggle/>

        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>

          <Link href="/register">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
