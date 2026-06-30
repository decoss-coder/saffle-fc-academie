export const DAYS_OF_WEEK = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
] as const;

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  ok: "OK",
  need_renewal: "À renouveler",
  missing: "Manquant",
  loaned: "Prêté",
};

export const EQUIPMENT_TYPES = [
  { key: "jersey_status", label: "Maillot" },
  { key: "shorts_status", label: "Short" },
  { key: "socks_status", label: "Chaussettes" },
  { key: "shin_guards_status", label: "Protège-tibias" },
] as const;

export const DISCIPLINE_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  warning: "Avertissement",
  suspended: "Suspendu",
};

export const BONUS_AMOUNTS = [
  { value: 2500, label: "2 500 FCFA (victoire standard)" },
  { value: 5000, label: "5 000 FCFA (grande victoire)" },
] as const;

export const LOGISTICS_CATEGORIES: Record<string, string> = {
  mower: "Tondeuse / terrain",
  gym: "Salle de gym",
  field: "Terrain",
  locker_room: "Vestiaires",
  other: "Autre",
};

export const WELFARE_TYPES: Record<string, string> = {
  housing: "Aide logement",
  food: "Aide nourriture",
  other: "Autre aide",
};

export function formatDay(day: number) {
  return DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? String(day);
}

export function hoursBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}
