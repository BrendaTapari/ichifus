export type Pet = {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  public_slug: string;
  emergency_contact: string | null;
  vet_contact: string | null;
  medical_notes: string | null;
  avatar_url: string | null;
  photos: PetPhoto[];
  role: "owner" | "caregiver" | string;
};

export type PetPhoto = {
  id: number;
  url: string;
};

export type PetInput = {
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  emergency_contact: string | null;
  vet_contact: string | null;
  medical_notes: string | null;
};

export type PublicPet = {
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  emergency_contact: string | null;
  vet_contact: string | null;
  medical_notes: string | null;
  avatar_url: string | null;
  photo_urls: string[];
};

export type EventType = "vaccine" | "deworming" | "surgery" | "consultation";

export type MedicalEvent = {
  id: number;
  pet_id: number;
  event_type: EventType;
  date: string;
  weight: number | null;
  notes: string | null;
  attachment_url: string | null;
  attachment_urls: string[];
};
