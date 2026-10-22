"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { eventLabel } from "@/lib/events";
import { formatDate } from "@/lib/format";
import type { MedicalEvent } from "@/lib/types";

function EventPhotos({ event }: { event: MedicalEvent }) {
  const urls = event.attachment_urls?.length ? event.attachment_urls : event.attachment_url ? [event.attachment_url] : [];
  if (!urls.length) return null;
  return (
    <div className={`mt-3 grid gap-2 ${urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {urls.map((url) => (
        <a key={url} href={url} target="_blank" rel="noreferrer">
          <img src={url} alt="Foto de la visita" className="h-32 w-full rounded-xl object-cover" />
        </a>
      ))}
    </div>
  );
}

const BADGE: Record<string, string> = {
  vaccine: "badge-info",
  deworming: "badge-success",
  surgery: "badge-warning",
  consultation: "badge-ghost",
};

export default function ClinicalTimeline({
  events,
  onDeleted,
}: {
  events: MedicalEvent[];
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  if (events.length === 0) {
    return <div className="alert">Todavía no hay visitas en el historial.</div>;
  }

  async function remove(eventId: number) {
    if (!window.confirm("¿Eliminar esta entrada del historial?")) return;
    try {
      await api(`/api/events/${eventId}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la entrada");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <ul className="timeline timeline-vertical">
      {events.map((event, index) => (
        <li key={event.id}>
          {index > 0 && <hr />}
          <div className="timeline-start text-xs font-medium">{formatDate(event.date)}</div>
          <div className="timeline-middle">
            <span className="block h-4 w-4 rounded-full bg-primary" />
          </div>
          <div className="timeline-end timeline-box w-full">
            <div className="flex items-start justify-between gap-2">
              <span className={`badge ${BADGE[event.event_type] ?? "badge-ghost"}`}>{eventLabel(event.event_type)}</span>
              <button className="btn btn-ghost btn-xs text-error" type="button" onClick={() => remove(event.id)}>
                Quitar
              </button>
            </div>
            {event.weight != null && <p className="mt-2 text-sm">Peso: {event.weight} kg</p>}
            {event.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{event.notes}</p>}
            <EventPhotos event={event} />
          </div>
          {index < events.length - 1 && <hr />}
        </li>
      ))}
      </ul>
    </div>
  );
}
