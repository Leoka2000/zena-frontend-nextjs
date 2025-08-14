import { LoginForm } from "@/components/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex h-screen flex-col items-center  bg-muted justify-center">
      <Image
        src="/zanelogo.png"
        alt="Logo"
        width={124}
        height={124}
        className="mx-auto mb-8"
      />
      <LoginForm />
    </div>
  );
}
