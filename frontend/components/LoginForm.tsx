"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Field from "@/components/Field";
import Logo from "@/components/Logo";
import GoogleSignIn from "@/components/GoogleSignIn";
import { api } from "@/lib/api";
import { getToken, setSession } from "@/lib/auth";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const destination = safeNext(next);
  const fromInvite = Boolean(next);
  const [email, setEmail] = useState(fromInvite ? "" : "admin@clinica.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace(destination);
  }, [router, destination]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await api<{ access_token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(data.access_token);
      router.replace(safeNext(searchParams.get("next")));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ingresar");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <div className="card w-full bg-base-100 shadow-xl">
        <form className="card-body gap-3" onSubmit={onSubmit}>
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ichifus</span>
          </Link>
          <h1 className="text-4xl">Ingresar</h1>
          <p className="text-sm opacity-70">Panel privado del historial clínico.</p>
          {error && <div className="alert alert-error text-sm">{error}</div>}
          <GoogleSignIn
            onSuccess={(accessToken) => {
              setSession(accessToken);
              router.replace(destination);
            }}
            onError={setError}
          />
          <div className="divider my-0 text-xs">o con correo</div>
          <Field label="Correo">
            <input
              className="input input-bordered w-full"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Contraseña">
            <input
              className="input input-bordered w-full"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <div className="card-actions mt-2 flex-col">
            <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
              {pending && <span className="loading loading-spinner" />}
              Entrar
            </button>
            <Link
              className="btn btn-ghost btn-block"
              href={next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"}
            >
              Crear cuenta
            </Link>
          </div>
          {!fromInvite && (
            <div className="alert alert-info text-sm">
              <span>
                Acceso inicial, si no cambiaste las variables de entorno: admin@clinica.local / admin123.
              </span>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
