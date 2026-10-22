"use client";

export default function PublicError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4">
      <div className="alert alert-error">{error.message}</div>
      <button className="btn" type="button" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
