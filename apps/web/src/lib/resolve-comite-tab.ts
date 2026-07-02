export type ComiteTab = "cotisations" | "membres" | "creer";

export function resolveComiteTab(
  tab: string | undefined,
  canManage: boolean,
): ComiteTab {
  if (tab === "creer" && canManage) return "creer";
  if (tab === "membres") return "membres";
  if (tab === "suivi") return "cotisations";
  return "cotisations";
}
