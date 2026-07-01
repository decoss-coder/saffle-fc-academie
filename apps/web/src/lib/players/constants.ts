export const PLAYER_CATEGORIES = [
  { value: "u9", label: "U9" },
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

/** Groupes effectifs du club (formation + équipes compétition) */
export const PLAYER_GROUPS = [
  { team: "U12", category: "u12" as const, label: "U12 — Petits" },
  { team: "U16", category: "u16" as const, label: "U16 — Grands" },
  { team: "Équipe A", category: "team_a" as const, label: "Équipe A" },
  { team: "Équipe B", category: "team_b" as const, label: "Équipe B" },
] as const;

export function resolvePlayerTeam(player: {
  team?: string | null;
  category?: string | null;
}) {
  if (player.team) {
    const byTeam = PLAYER_GROUPS.find((group) => group.team === player.team);
    if (byTeam) return byTeam.team;
  }
  if (player.category) {
    const byCategory = PLAYER_GROUPS.find(
      (group) => group.category === player.category,
    );
    if (byCategory) return byCategory.team;
  }
  return null;
}

export function playersInTeam<T extends { team?: string | null; category?: string | null }>(
  players: T[],
  team: string,
) {
  return players.filter((player) => resolvePlayerTeam(player) === team);
}

export function groupForCategory(category: string) {
  return PLAYER_GROUPS.find((g) => g.category === category)?.label ?? category;
}

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
