"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Field from "@/components/Field";
import Logo from "@/components/Logo";
import GoogleSignIn from "@/components/GoogleSignIn";
import TermsConsent from "@/components/TermsConsent";
import { api } from "@/lib/api";
import { getToken, setSession } from "@/lib/auth";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = safeNext(searchParams.get("next"));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace(destination);
  }, [router, destination]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!accepted) {
      setError("Tenés que aceptar los términos y condiciones");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const data = await api<{ access_token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, accept_terms: true, first_name: firstName, last_name: lastName }),
      });
      setSession(data.access_token);
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
      setPending(false);
    }
  }

  const loginHref = searchParams.get("next")
    ? `/login?next=${encodeURIComponent(searchParams.get("next") || "")}`
    : "/login";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <div className="card w-full bg-base-100 shadow-xl">
        <form className="card-body gap-3" onSubmit={onSubmit}>
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ichifus</span>
          </Link>
          <h1 className="text-4xl">Crear cuenta</h1>
          <p className="text-sm opacity-70">Registrate para llevar el historial de tus mascotas.</p>
          {error && <div className="alert alert-error text-sm">{error}</div>}
          <TermsConsent checked={accepted} onChange={setAccepted} />
          <GoogleSignIn
            acceptTerms={accepted}
            onSuccess={(accessToken) => {
              setSession(accessToken);
              router.replace(destination);
            }}
            onError={setError}
          />
          <div className="divider my-0 text-xs">o con correo</div>
          <Field label="Nombre">
            <input
              className="input input-bordered w-full"
              autoComplete="given-name"
              required
              maxLength={80}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </Field>
          <Field label="Apellido">
            <input
              className="input input-bordered w-full"
              autoComplete="family-name"
              required
              maxLength={80}
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </Field>
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
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field label="Repetir contraseña">
            <input
              className="input input-bordered w-full"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>
          <div className="card-actions mt-2 flex-col">
            <button className="btn btn-primary btn-block" type="submit" disabled={pending || !accepted}>
              {pending && <span className="loading loading-spinner" />}
              Crear cuenta
            </button>
            <Link className="btn btn-ghost btn-block" href={loginHref}>
              Ya tengo cuenta
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
