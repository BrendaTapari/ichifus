import Link from "next/link";

import Logo from "@/components/Logo";

export default function PublicNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ichifus</span>
          </Link>
          <h1 className="card-title">Ficha no encontrada</h1>
          <p>El código QR no corresponde a una mascota cargada.</p>
          <div className="card-actions">
            <Link href="/" className="btn btn-primary">
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
