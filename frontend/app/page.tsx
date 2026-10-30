import Link from "next/link";

import Logo from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-12">
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body gap-3">
          <div className="flex items-center gap-4">
            <Logo className="h-16 w-16 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase leading-snug tracking-[0.14em] text-primary">
                Registro veterinario de seguimiento
              </p>
              <h1 className="text-5xl leading-none">Ichifus</h1>
            </div>
          </div>
          <p className="text-base-content/80">
            Seguimiento de tus mascotas, con fotos y ficha pública para el collar. El panel es para quien comparte la tenencia.
          </p>
          <div className="card-actions mt-2 flex-col">
            <Link href="/registro" className="btn btn-primary btn-block">
              Crear cuenta
            </Link>
            <Link href="/login" className="btn btn-ghost btn-block">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
