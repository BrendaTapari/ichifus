"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";

type GoogleConfig = {
  enabled: boolean;
  client_id: string | null;
};

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-google-signin]");
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.googleSignin = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google"));
    document.head.appendChild(script);
  });
}

export default function GoogleSignIn({
  onSuccess,
  onError,
  acceptTerms,
}: {
  onSuccess: (accessToken: string) => void;
  onError: (message: string) => void;
  acceptTerms?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const acceptTermsRef = useRef(acceptTerms);
  const [missing, setMissing] = useState(false);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  acceptTermsRef.current = acceptTerms;

  useEffect(() => {
    let cancelled = false;
    api<GoogleConfig>("/api/auth/google/config")
      .then(async (config) => {
        if (cancelled) return;
        if (!config.enabled || !config.client_id || !host.current) {
          setMissing(true);
          return;
        }
        await loadGoogle();
        if (cancelled || !host.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: config.client_id,
          callback: (response) => {
            if (acceptTermsRef.current === false) {
              onErrorRef.current("Tenés que aceptar los términos y condiciones");
              return;
            }
            api<{ access_token: string }>("/api/auth/google", {
              method: "POST",
              body: JSON.stringify({ credential: response.credential, accept_terms: acceptTermsRef.current === true }),
            })
              .then((data) => onSuccessRef.current(data.access_token))
              .catch((err: unknown) => onErrorRef.current(err instanceof Error ? err.message : "No se pudo ingresar con Google"));
          },
        });
        window.google.accounts.id.renderButton(host.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: Math.max(host.current.offsetWidth, 280),
          locale: "es",
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) onErrorRef.current(err instanceof Error ? err.message : "No se pudo preparar Google");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (missing) {
    return (
      <button
        className="btn btn-outline btn-block"
        type="button"
        onClick={() => {
          if (acceptTerms === false) {
            onError("Tenés que aceptar los términos y condiciones");
            return;
          }
          onError("Falta el Client ID de Google en el servidor");
        }}
      >
        Continuar con Google
      </button>
    );
  }

  return <div ref={host} className="flex min-h-10 justify-center" />;
}
