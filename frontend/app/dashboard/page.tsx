"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Pet } from "@/lib/types";

export default function DashboardPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<Pet[]>("/api/pets")
      .then((data) => {
        setPets(data);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "No se pudo cargar el listado"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Panel</p>
          <h1 className="text-4xl">Mascotas</h1>
        </div>
        <Link href="/dashboard/pets/new" className="btn btn-primary btn-sm">
          Nueva
        </Link>
      </div>

      <div className="stats w-full shadow">
        <div className="stat">
          <div className="stat-title">Fichas activas</div>
          <div className="stat-value text-primary">{loading ? "–" : pets.length}</div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="btn btn-sm" type="button" onClick={load}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : pets.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center text-center">
            <h2 className="card-title">Todavía no hay mascotas</h2>
            <p>Cargá la primera ficha para generar su código QR.</p>
            <div className="card-actions">
              <Link href="/dashboard/pets/new" className="btn btn-primary">
                Nueva mascota
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {pets.map((pet) => (
            <Link key={pet.id} href={`/dashboard/pets/${pet.id}`} className="card overflow-hidden bg-base-100 shadow">
              <div className="relative h-44 overflow-hidden">
                {pet.avatar_url ? (
                  <img src={pet.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary">
                    <span className="font-display text-8xl text-white/45">{pet.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
                  <div>
                    <h2 className="text-3xl text-white">{pet.name}</h2>
                    <p className="text-sm text-white/85">
                      {pet.species}
                      {pet.breed ? ` · ${pet.breed}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {pet.role === "caregiver" && <span className="badge badge-outline border-white/70 text-white">Compartida</span>}
                    {pet.medical_notes && <span className="badge badge-warning">Alerta</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
