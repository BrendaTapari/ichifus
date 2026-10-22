import { cache } from "react";

import type { PublicPet } from "@/lib/types";

export const fetchPublicPet = cache(async (slug: string): Promise<PublicPet | null> => {
  const base = process.env["API_INTERNAL_URL"] || "http://127.0.0.1:8000";
  let response: Response;
  try {
    response = await fetch(`${base}/api/public/pets/${encodeURIComponent(slug)}`, { cache: "no-store" });
  } catch {
    throw new Error("El servicio clínico no está disponible");
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("No se pudo cargar la ficha");
  return response.json();
});
