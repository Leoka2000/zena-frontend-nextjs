"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"
import router from "next/router"
import Link from "next/link"

export function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("http://localhost:8080/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode }),
      })

      const text = await res.text()

      if (res.ok) {
        setSuccessDialogOpen(true)
      } else {
        setError(text)
      }
    } catch {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  

  return (
    <>
      <form onSubmit={handleVerify} className="w-full max-w-md space-y-6">
        <h1 className="text-xl font-semibold text-center">
          Please verify your email box and paste here the verification code sent to you.
        </h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input id="code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </form>

      <Dialog open={successDialogOpen} onOpenChange={(open) => {
  setSuccessDialogOpen(open)
  if (!open) {
    router.push("/login") // Redirect when user closes the dialog
  }
}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Successful</DialogTitle>
          </DialogHeader>
          <p className="text-center">You have successfully verified your account. You can now log in.</p>
          <Link href="/login" className="text-blue-500 hover:underline">
            <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Verifying..." : "Login"}
        </Button>
        </Link>
        </DialogContent>
      </Dialog>
    </>
  )
}
