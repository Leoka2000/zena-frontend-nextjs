"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setToken, isAuthenticated } from "@/lib/auth"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // 👇 Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("http://localhost:8080/req/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        router.push("/dashboard") // 👈 Redirect after login
      } else {
        setError("Invalid credentials")
      }
    } catch {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full md:w-96", className)} {...props}>
      <Card>
        <Image src="/zanelogo.png" alt="Logo" width={124} height={124} className="mx-auto mb-4" />
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2 mb-6">
                <a
                    href="#"
                    className="ml-auto inline-block gap-0 text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                <Label htmlFor="password">Password</Label>
                
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Please wait" : "Login"}
              </Button>
            </div>
             <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
          
       <Link href="/register" className="underline underline-offset-4">
                Sign up
       
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
