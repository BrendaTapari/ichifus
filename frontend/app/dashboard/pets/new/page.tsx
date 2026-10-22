"use client";

import { useRouter } from "next/navigation";

import PetForm from "@/components/PetForm";
import { api } from "@/lib/api";
import type { Pet, PetInput } from "@/lib/types";

export default function NewPetPage() {
  const router = useRouter();

  async function handleCreate(payload: PetInput, files: File[]) {
    const pet = await api<Pet>("/api/pets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (files.length) {
      const body = new FormData();
      files.forEach((file) => body.append("files", file));
      try {
        await api(`/api/pets/${pet.id}/photos`, { method: "POST", body });
      } catch {
        router.push(`/dashboard/pets/${pet.id}?aviso=foto`);
        return;
      }
    }
    router.push(`/dashboard/pets/${pet.id}`);
  }

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h1 className="card-title text-2xl">Nueva mascota</h1>
        <PetForm submitLabel="Crear ficha" onSubmit={handleCreate} />
      </div>
    </div>
  );
}
