export const EVENT_OPTIONS = [
  { value: "vaccine", label: "Vacuna" },
  { value: "deworming", label: "Desparasitación" },
  { value: "surgery", label: "Cirugía" },
  { value: "consultation", label: "Consulta" },
] as const;

export function eventLabel(value: string) {
  return EVENT_OPTIONS.find((item) => item.value === value)?.label ?? value;
}
