"use client";

import { useEffect, useMemo, useState } from "react";

import Field from "@/components/Field";
import GalleryInput from "@/components/GalleryInput";
import type { Pet, PetInput } from "@/lib/types";

const SPECIES = ["Perro", "Gato", "Ave", "Conejo", "Reptil", "Otro"];

export default function PetForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Pet | null;
  submitLabel: string;
  onSubmit: (payload: PetInput, files: File[]) => Promise<void>;
}) {
  const speciesOptions = useMemo(() => {
    if (initial?.species && !SPECIES.includes(initial.species)) return [initial.species, ...SPECIES];
    return SPECIES;
  }, [initial?.species]);

  const [name, setName] = useState(initial?.name ?? "");
  const [species, setSpecies] = useState(initial?.species || "Perro");
  const [breed, setBreed] = useState(initial?.breed ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birth_date?.slice(0, 10) ?? "");
  const [emergency, setEmergency] = useState(initial?.emergency_contact ?? "");
  const [vet, setVet] = useState(initial?.vet_contact ?? "");
  const [notes, setNotes] = useState(initial?.medical_notes ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onSubmit(
        {
          name: name.trim(),
          species,
          breed: breed.trim() || null,
          birth_date: birthDate || null,
          emergency_contact: emergency.trim() || null,
          vet_contact: vet.trim() || null,
          medical_notes: notes.trim() || null,
        },
        files
      );
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <Field label="Nombre">
        <input className="input input-bordered w-full" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="Especie">
        <select className="select select-bordered w-full" value={species} onChange={(event) => setSpecies(event.target.value)}>
          {speciesOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Raza">
        <input className="input input-bordered w-full" maxLength={120} value={breed} onChange={(event) => setBreed(event.target.value)} />
      </Field>
      <Field label="Fecha de nacimiento">
        <input className="input input-bordered w-full" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
      </Field>
      <Field label="Contacto de emergencia">
        <input
          className="input input-bordered w-full"
          inputMode="tel"
          placeholder="+54 9 11 5555 5555"
          maxLength={40}
          value={emergency}
          onChange={(event) => setEmergency(event.target.value)}
        />
      </Field>
      <Field label="Veterinario de cabecera">
        <input
          className="input input-bordered w-full"
          placeholder="Dra. López · +54 9 11 4444 4444"
          maxLength={160}
          value={vet}
          onChange={(event) => setVet(event.target.value)}
        />
      </Field>
      <Field label="Alertas y alergias">
        <textarea
          className="textarea textarea-bordered w-full"
          rows={4}
          maxLength={2000}
          placeholder="Alergia a un antibiótico, convulsiones, medicación crónica..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
      {!initial && (
        <Field label="Fotos">
          <GalleryInput label="Elegir de la galería" disabled={pending} onPick={setFiles} onError={setError} />
          {previews.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {previews.map((url) => (
                <img key={url} src={url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              ))}
            </div>
          )}
        </Field>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending && <span className="loading loading-spinner" />}
        {submitLabel}
      </button>
    </form>
  );
}
