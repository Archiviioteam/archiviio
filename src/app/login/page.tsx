import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] flex-1 items-center justify-center p-8">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
