"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import { displayName } from "@/lib/format";

export default function Navbar() {
  const router = useRouter();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    api<{ email: string; first_name: string | null; last_name: string | null }>("/api/auth/me")
      .then((user) => setLabel(displayName(user)))
      .catch(() => undefined);
  }, []);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="navbar sticky top-0 z-30">
      <div className="mx-auto flex w-full max-w-2xl items-center px-2">
        <div className="flex flex-1 items-center gap-2">
          <Logo className="h-8 w-8 shrink-0" />
          <div>
            <Link href="/dashboard" className="text-lg font-bold leading-none">
              Ichifus
            </Link>
            {label && <p className="text-xs opacity-70">{label}</p>}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={logout}>
          Salir
        </button>
      </div>
    </div>
  );
}
