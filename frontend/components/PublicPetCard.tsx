import PhotoCarousel from "@/components/PhotoCarousel";
import { extractPhone, formatAge, telUrl, whatsappUrl } from "@/lib/format";
import type { PublicPet } from "@/lib/types";

export default function PublicPetCard({ pet }: { pet: PublicPet }) {
  const age = formatAge(pet.birth_date);
  const emergencyPhone = extractPhone(pet.emergency_contact);
  const vetPhone = extractPhone(pet.vet_contact);
  const callVet = vetPhone ? telUrl(vetPhone) : null;
  const initial = pet.name.trim().slice(0, 1).toUpperCase() || "?";
  const photos = pet.photo_urls?.length ? pet.photo_urls : pet.avatar_url ? [pet.avatar_url] : [];

  return (
    <article className="card overflow-hidden bg-base-100 shadow-xl">
      {photos.length > 0 ? (
        <PhotoCarousel urls={photos} name={pet.name} />
      ) : (
        <div className="flex h-64 items-center justify-center bg-gradient-to-br from-primary to-secondary">
          <span className="font-display text-7xl text-primary-content">{initial}</span>
        </div>
      )}
      <div className="card-body gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ficha pública</p>
          <h1 className="card-title text-4xl">{pet.name}</h1>
          <p className="mt-1">
            {pet.species}
            {pet.breed ? ` · ${pet.breed}` : ""}
          </p>
          {age && <p className="text-sm opacity-70">{age}</p>}
        </div>

        {pet.medical_notes && (
          <div className="alert alert-warning">
            <div>
              <p className="font-semibold">Alertas y alergias</p>
              <p className="whitespace-pre-wrap">{pet.medical_notes}</p>
            </div>
          </div>
        )}

        {pet.emergency_contact && (
          <div className="rounded-2xl bg-primary/10 p-4">
            <p className="text-sm font-semibold">Contacto de emergencia</p>
            <p>{pet.emergency_contact}</p>
            {emergencyPhone && (
              <div className="card-actions mt-3">
                <a className="btn btn-primary btn-block" href={whatsappUrl(emergencyPhone, pet.name)} target="_blank" rel="noreferrer">
                  WhatsApp de emergencia
                </a>
              </div>
            )}
          </div>
        )}

        {pet.vet_contact && (
          <div className="rounded-2xl bg-base-200 p-4">
            <p className="text-sm font-semibold">Veterinario de cabecera</p>
            <p>{pet.vet_contact}</p>
            {callVet && (
              <a className="btn btn-outline btn-block mt-3" href={callVet}>
                Llamar al veterinario
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
