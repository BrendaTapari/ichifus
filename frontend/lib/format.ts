export function displayName(person: { first_name?: string | null; last_name?: string | null; email?: string | null }) {
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ").trim();
  return name || person.email || "";
}

export function formatDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAge(iso: string | null) {
  if (!iso) return null;
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const birth = new Date(year, month - 1, day);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return null;
  if (months < 12) return months === 1 ? "1 mes" : `${months} meses`;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const yearLabel = years === 1 ? "1 año" : `${years} años`;
  if (!remainder) return yearLabel;
  const monthLabel = remainder === 1 ? "1 mes" : `${remainder} meses`;
  return `${yearLabel} y ${monthLabel}`;
}

export function extractPhone(value: string | null) {
  if (!value) return null;
  const match = value.match(/\+?\d[\d\s()-]{6,}\d/);
  return match ? match[0].trim() : null;
}

export function whatsappUrl(phone: string, petName: string) {
  const digits = phone.replace(/\D/g, "");
  const text = encodeURIComponent(`Hola, necesito ayuda urgente con ${petName}.`);
  return `https://wa.me/${digits}?text=${text}`;
}

export function telUrl(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
}
