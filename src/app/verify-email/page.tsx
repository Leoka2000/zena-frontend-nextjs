import React, { Suspense } from "react";
import VerifyEmailFormWrapper from "./VerifyEmailFormWrapper";

export default function VerifyEmailPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailFormWrapper />
      </Suspense>
    </div>
  );
}
