"use client";

import { useEffect, useState } from "react";

import Field from "@/components/Field";
import GalleryInput from "@/components/GalleryInput";
import { api } from "@/lib/api";
import { EVENT_OPTIONS } from "@/lib/events";

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function EventForm({ petId, onCreated }: { petId: number; onCreated: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [eventType, setEventType] = useState("vaccine");
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);
    const body = new FormData();
    body.append("event_type", eventType);
    body.append("date", date);
    if (weight.trim()) body.append("weight", weight.replace(",", "."));
    if (notes.trim()) body.append("notes", notes.trim());
    files.forEach((file) => body.append("files", file));

    try {
      await api(`/api/pets/${petId}/events`, { method: "POST", body });
      setNotes("");
      setWeight("");
      setFiles([]);
      setSuccess(true);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la entrada");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      {error && <div className="alert alert-error text-sm">{error}</div>}
      {success && <div className="alert alert-success text-sm">Entrada guardada en el historial.</div>}
      <Field label="Tipo de evento">
        <select className="select select-bordered w-full" value={eventType} onChange={(event) => setEventType(event.target.value)}>
          {EVENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Fecha">
        <input className="input input-bordered w-full" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
      </Field>
      <Field label="Peso (kg)">
        <input
          className="input input-bordered w-full"
          type="number"
          inputMode="decimal"
          min="0"
          max="500"
          step="0.01"
          placeholder="12.4"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
        />
      </Field>
      <Field label="Notas">
        <textarea
          className="textarea textarea-bordered w-full"
          rows={4}
          maxLength={4000}
          placeholder="Lote de la vacuna, evolución, indicaciones..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
      <Field label="Fotos de la visita">
        <GalleryInput label="Elegir de la galería" disabled={pending} onPick={setFiles} onError={setError} />
        {previews.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {previews.map((url) => (
              <img key={url} src={url} alt="" className="h-16 w-16 rounded-xl object-cover" />
            ))}
          </div>
        )}
      </Field>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending && <span className="loading loading-spinner" />}
        Guardar entrada
      </button>
    </form>
  );
}
