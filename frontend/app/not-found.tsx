import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <div className="card w-full bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title">Página no encontrada</h1>
          <div className="card-actions">
            <Link href="/" className="btn btn-primary">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
