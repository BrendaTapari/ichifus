"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ClinicalTimeline from "@/components/ClinicalTimeline";
import DeletePetButton from "@/components/DeletePetButton";
import EventForm from "@/components/EventForm";
import PetForm from "@/components/PetForm";
import PetPhotos from "@/components/PetPhotos";
import QrModal from "@/components/QrModal";
import ShareCustody from "@/components/ShareCustody";
import { api } from "@/lib/api";
import { formatAge } from "@/lib/format";
import type { MedicalEvent, Pet, PetInput } from "@/lib/types";

export default function PetDetail({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = Number(id);
  const [pet, setPet] = useState<Pet | null>(null);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reloadEvents = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!Number.isInteger(petId) || petId <= 0) {
      setError("La ficha no existe");
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([api<Pet>(`/api/pets/${petId}`), api<MedicalEvent[]>(`/api/pets/${petId}/events`)])
      .then(([petData, eventData]) => {
        if (cancelled) return;
        setPet(petData);
        setEvents(eventData);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar la ficha");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [petId, reloadKey]);

  async function savePet(payload: PetInput) {
    const updated = await api<Pet>(`/api/pets/${petId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setPet(updated);
    setSaved(true);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex flex-col gap-3">
        <div className="alert alert-error">{error ?? "La ficha no existe"}</div>
        <button className="btn" type="button" onClick={() => router.push("/dashboard")}>
          Volver
        </button>
      </div>
    );
  }

  const age = formatAge(pet.birth_date);
  const photoWarning = searchParams.get("aviso") === "foto";

  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard" className="btn btn-ghost btn-sm w-fit">
        Volver
      </Link>

      {photoWarning && (
        <div className="alert alert-warning text-sm">La ficha se guardó, pero la foto no se pudo subir. Podés reintentarlo al editar.</div>
      )}
      {error && <div className="alert alert-error text-sm">{error}</div>}

      <section className="card bg-base-100 shadow">
        <div className="card-body gap-3">
          <div className="flex items-center gap-4">
            <div className={pet.avatar_url ? "avatar" : "avatar avatar-placeholder"}>
              <div className="grid w-20 place-items-center rounded-full bg-primary text-2xl text-primary-content">
                {pet.avatar_url ? <img src={pet.avatar_url} alt="" /> : <span>{pet.name.slice(0, 1).toUpperCase()}</span>}
              </div>
            </div>
            <div>
              <h1 className="text-4xl">{pet.name}</h1>
              <p className="text-sm">
                {pet.species}
                {pet.breed ? ` · ${pet.breed}` : ""}
                {age ? ` · ${age}` : ""}
              </p>
            </div>
          </div>
          {pet.medical_notes && <div className="alert alert-warning text-sm">{pet.medical_notes}</div>}
          <div className="card-actions">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setQrOpen(true)}>
              Código QR
            </button>
            <Link className="btn btn-outline btn-sm" href={`/p/${pet.public_slug}`} target="_blank">
              Ver ficha pública
            </Link>
            {pet.role === "owner" && <DeletePetButton petId={pet.id} petName={pet.name} />}
          </div>
        </div>
      </section>

      <QrModal slug={pet.public_slug} open={qrOpen} onClose={() => setQrOpen(false)} />

      <PetPhotos pet={pet} onChange={setPet} />

      <ShareCustody petId={pet.id} petName={pet.name} role={pet.role} />

      <div className="collapse collapse-arrow bg-base-100 shadow">
        <input type="checkbox" aria-label="Editar ficha" />
        <div className="collapse-title font-semibold">Editar ficha</div>
        <div className="collapse-content">
          {saved && <div className="alert alert-success mb-3 text-sm">Cambios guardados.</div>}
          <PetForm initial={pet} submitLabel="Guardar cambios" onSubmit={savePet} />
        </div>
      </div>

      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Historial clínico</h2>
          <ClinicalTimeline events={events} onDeleted={reloadEvents} />
        </div>
      </section>

      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Nueva entrada</h2>
          <EventForm petId={pet.id} onCreated={reloadEvents} />
        </div>
      </section>
    </div>
  );
}
