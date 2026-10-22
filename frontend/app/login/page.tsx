import { Suspense } from "react";

import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
