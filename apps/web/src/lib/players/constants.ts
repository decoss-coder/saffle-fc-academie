export const PLAYER_CATEGORIES = [
  { value: "u10", label: "U10" },
  { value: "u11", label: "U11" },
  { value: "u12", label: "U12" },
  { value: "u13", label: "U13" },
  { value: "u14", label: "U14" },
  { value: "u15", label: "U15" },
  { value: "u16", label: "U16" },
  { value: "u17", label: "U17" },
  { value: "u18", label: "U18" },
  { value: "team_a", label: "Équipe A" },
  { value: "team_b", label: "Équipe B" },
] as const;

export type PlayerCategory = (typeof PLAYER_CATEGORIES)[number]["value"];

export function formatCategory(category: string) {
  return (
    PLAYER_CATEGORIES.find((item) => item.value === category)?.label ?? category
  );
}

export function formatGender(gender: string) {
  return gender === "F" ? "Féminin" : "Masculin";
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("fr-CI", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
