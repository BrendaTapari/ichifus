"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api";

export default function DeletePetButton({ petId, petName }: { petId: number; petName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      await api(`/api/pets/${petId}`, { method: "DELETE" });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
      setPending(false);
    }
  }

  return (
    <>
      <button className="btn btn-outline btn-error btn-sm" type="button" onClick={() => setOpen(true)}>
        Eliminar
      </button>
      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Eliminar ficha</h3>
            <p className="py-3">
              Se borra el historial de <strong>{petName}</strong> y sus fotos. Esta acción no se puede deshacer.
            </p>
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <div className="modal-action">
              <button className="btn btn-error" type="button" onClick={remove} disabled={pending}>
                {pending && <span className="loading loading-spinner" />}
                Eliminar
              </button>
              <button className="btn" type="button" onClick={() => setOpen(false)} disabled={pending}>
                Cancelar
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setOpen(false)}>
              cerrar
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
