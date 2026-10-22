import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PublicPetCard from "@/components/PublicPetCard";
import { fetchPublicPet } from "@/lib/public";

export const dynamic = "force-dynamic";

type Props = { params: { public_slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const pet = await fetchPublicPet(params.public_slug);
    if (!pet) return { title: "Ficha no encontrada" };
    return { title: pet.name, description: `Ficha de ${pet.name}` };
  } catch {
    return { title: "Ficha pública" };
  }
}

export default async function PublicPetPage({ params }: Props) {
  const pet = await fetchPublicPet(params.public_slug);
  if (!pet) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-4 py-8">
      <PublicPetCard pet={pet} />
      <p className="mt-4 text-center text-xs opacity-60">Ficha de solo lectura</p>
    </main>
  );
}
