import { RegisterForm } from "@/components/RegisterForm"
import Image from "next/image"

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted  md:p-10">
       <Image
          src="/zanelogo.png"
          alt="Logo"
          width={124}
          height={124}
          className="mx-auto"
        />
      <RegisterForm />
    </div>
  )
}
