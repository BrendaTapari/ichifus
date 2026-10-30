"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Field from "@/components/Field";
import Logo from "@/components/Logo";
import GoogleSignIn from "@/components/GoogleSignIn";
import TermsConsent from "@/components/TermsConsent";
import { api } from "@/lib/api";
import { getToken, setSession } from "@/lib/auth";

type Preview = {
  pet_name: string;
  species: string;
  breed: string | null;
  inviter_email: string;
  inviter_name: string;
  expires_at: string;
};

export default function InviteAccept({ token }: { token: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoggedIn(Boolean(getToken()));
    let cancelled = false;
    api<Preview>(`/api/invitations/${token}`)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "La invitación no está disponible");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept() {
    setPending(true);
    setError(null);
    try {
      const data = await api<{ pet_id: number }>(`/api/invitations/${token}/accept`, { method: "POST" });
      router.replace(`/dashboard/pets/${data.pet_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aceptar la tenencia");
      setPending(false);
    }
  }

  async function register(event: React.FormEvent) {
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
      const data = await api<{ access_token: string; pet_id: number }>(`/api/invitations/${token}/register`, {
        method: "POST",
        body: JSON.stringify({ email, password, accept_terms: true, first_name: firstName, last_name: lastName }),
      });
      setSession(data.access_token);
      router.replace(`/dashboard/pets/${data.pet_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
      setPending(false);
    }
  }

  const loginHref = `/login?next=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ichifus</span>
          </Link>
          <h1 className="card-title text-2xl">Compartamos tenencia</h1>
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : !preview ? (
            <div className="alert alert-error text-sm">{error ?? "La invitación no está disponible"}</div>
          ) : (
            <>
              <p className="text-sm">
                {`${preview.inviter_name || preview.inviter_email} te invita a compartir la tenencia de `}
                <strong>{preview.pet_name}</strong>
                {` (${[preview.breed, preview.species.toLowerCase()].filter(Boolean).join(", ")}). Vas a poder llevarla al veterinario y cargar vacunas, visitas y el resto del historial.`}
              </p>
              {error && <div className="alert alert-error text-sm">{error}</div>}
              {loggedIn ? (
                <button className="btn btn-primary btn-block" type="button" disabled={pending} onClick={accept}>
                  {pending && <span className="loading loading-spinner" />}
                  Aceptar tenencia
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <TermsConsent checked={accepted} onChange={setAccepted} />
                  <GoogleSignIn
                    acceptTerms={accepted}
                    onSuccess={(accessToken) => {
                      setSession(accessToken);
                      setLoggedIn(true);
                      void accept();
                    }}
                    onError={setError}
                  />
                  <div className="divider my-0 text-xs">o crear cuenta</div>
                <form className="flex flex-col gap-3" onSubmit={register}>
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
                  <button className="btn btn-primary btn-block" type="submit" disabled={pending || !accepted}>
                    {pending && <span className="loading loading-spinner" />}
                    Crear cuenta y aceptar
                  </button>
                  <Link className="btn btn-ghost btn-block" href={loginHref}>
                    Ya tengo cuenta
                  </Link>
                </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
