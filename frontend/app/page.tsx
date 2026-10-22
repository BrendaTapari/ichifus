import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-12">
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Clínica veterinaria</p>
          <h1 className="text-5xl leading-none">Ichifus</h1>
          <p className="text-base-content/80">
            Historial clínico de mascotas, con fotos y ficha pública para el collar. El panel es para quien comparte la tenencia.
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
