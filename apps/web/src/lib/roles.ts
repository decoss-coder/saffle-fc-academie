export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  president: "Président",
  board: "Bureau",
  treasurer: "Trésorier",
  coach: "Coach",
  parent: "Parent",
  player_formation: "Joueur formation",
  player_team_a: "Joueur équipe A",
  communication: "Communication",
  logistics: "Logistique",
};

export function formatRole(role: string, positionTitle?: string | null) {
  if (positionTitle) return positionTitle;
  return ROLE_LABELS[role] ?? role;
}

export const STAFF_ROLES = [
  { value: "admin", label: "Administrateur" },
  { value: "president", label: "Président" },
  { value: "board", label: "Bureau / poste administratif" },
  { value: "treasurer", label: "Trésorier" },
  { value: "coach", label: "Coach / encadrement" },
  { value: "communication", label: "Communication" },
  { value: "logistics", label: "Logistique / matériel" },
] as const;
