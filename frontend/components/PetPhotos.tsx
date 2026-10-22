"use client";

import { useState } from "react";

import GalleryInput from "@/components/GalleryInput";
import { api } from "@/lib/api";
import type { Pet } from "@/lib/types";

export default function PetPhotos({ pet, onChange }: { pet: Pet; onChange: (pet: Pet) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  async function upload(files: File[]) {
    if (!files.length) return;
    setPending(true);
    setError(null);
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    try {
      onChange(await api<Pet>(`/api/pets/${pet.id}/photos`, { method: "POST", body }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron subir las fotos");
    } finally {
      setPending(false);
    }
  }

  async function act(path: string, method: "POST" | "DELETE") {
    setPending(true);
    setError(null);
    try {
      onChange(await api<Pet>(path, { method }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la galería");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="card-title">Galería</h2>
            <p className="text-sm opacity-70">{pet.photos.length} de 12 fotos. La portada es la que se ve en el listado y en el QR.</p>
          </div>
          <GalleryInput label="Galería" disabled={pending || pet.photos.length >= 12} onPick={upload} onError={setError} />
        </div>
        {error && <div className="alert alert-error text-sm">{error}</div>}
        {pet.photos.length === 0 ? (
          <GalleryInput
            className="btn btn-ghost h-auto w-full rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-10 text-sm font-normal"
            label={`Elegir fotos de la galería de ${pet.name}`}
            disabled={pending}
            onPick={upload}
            onError={setError}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {pet.photos.map((photo) => {
              const cover = pet.avatar_url === photo.url;
              return (
                <figure key={photo.id} className={`overflow-hidden rounded-2xl ${cover ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                  <button type="button" className="block w-full" onClick={() => setActive(photo.url)}>
                    <img src={photo.url} alt="" className="h-36 w-full object-cover" />
                  </button>
                  <figcaption className="flex gap-1 bg-base-100 p-1">
                    <button
                      className="btn btn-ghost btn-xs flex-1"
                      type="button"
                      disabled={pending || cover}
                      onClick={() => act(`/api/pets/${pet.id}/photos/${photo.id}/cover`, "POST")}
                    >
                      {cover ? "Portada" : "Usar"}
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      type="button"
                      disabled={pending}
                      onClick={() => act(`/api/pets/${pet.id}/photos/${photo.id}`, "DELETE")}
                    >
                      Quitar
                    </button>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}
      </div>
      {active && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-3xl p-2">
            <img src={active} alt={`Foto de ${pet.name}`} className="max-h-[75vh] w-full rounded-2xl object-contain" />
            <div className="modal-action mt-2">
              <button className="btn btn-primary" type="button" onClick={() => setActive(null)}>
                Cerrar
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setActive(null)}>
              cerrar
            </button>
          </form>
        </dialog>
      )}
    </section>
  );
}
