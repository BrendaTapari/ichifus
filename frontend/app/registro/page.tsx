import { Suspense } from "react";

import RegisterForm from "@/components/RegisterForm";

export const metadata = {
  title: "Crear cuenta",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
