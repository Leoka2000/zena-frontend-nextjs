"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import router from "next/router";
import Link from "next/link";
import { toast } from "sonner";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  // Countdown effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown((prev) => prev - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://api.zane.hu/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verificationCode }),
      });

      const text = await res.text();

      if (res.ok) {
        setSuccessDialogOpen(true);
      } else {
        setError(text);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      const res = await fetch(
        `https://api.zane.hu/auth/resend?email=${email}`,
        {
          method: "POST",
        }
      );
      const text = await res.text();

      if (!res.ok) {
        setError(text);
      } else {
        setResendCooldown(30);
        toast.success("Verification email sent!");
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            Paste the code sent to <span className="font-medium">{email}</span>{" "}
            below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4 dark:text-red-400 text-red-500" />
                <AlertTitle className="dark:text-red-400">Error</AlertTitle>
                <AlertDescription className="dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>

            <CardFooter className="p-0 flex-col gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {loading ? "Verifying..." : "Verify"}
              </Button>

              <Button
                variant="ghost"
                type="button"
                className="w-full text-sm text-muted-foreground"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
              >
                {resendLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend available in ${resendCooldown}s`
                ) : (
                  "Resend Verification Code"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={successDialogOpen}
        onOpenChange={(open) => {
          setSuccessDialogOpen(open);
          if (!open) {
            router.push("/login");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verification Successful</DialogTitle>
          </DialogHeader>
          <p className="text-center">
            You have successfully verified your account. You can now log in.
          </p>
          <Link href="/login" className="w-full">
            <Button className="w-full mt-4">Login</Button>
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
}
