"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        <div className="flex-1">
          <Link href="/dashboard" className="text-lg font-bold">
            Ichifus
          </Link>
          {label && <p className="text-xs opacity-70">{label}</p>}
        </div>
        <button className="btn btn-ghost btn-sm" type="button" onClick={logout}>
          Salir
        </button>
      </div>
    </div>
  );
}
