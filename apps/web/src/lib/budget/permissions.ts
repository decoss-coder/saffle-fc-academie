import { createClient } from "@/lib/supabase/server";

export type BudgetSignoffRole = "secretary_general" | "president" | "treasurer";

export async function getUserRegistryMeta(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("phone_registry")
    .select("role, position_title")
    .eq("linked_user_id", userId)
    .maybeSingle();
  return data;
}

export function isSecretaryGeneral(
  role: string,
  positionTitle: string | null | undefined,
) {
  if (role === "admin") return true;
  if (role !== "board") return false;
  return (positionTitle ?? "").toLowerCase().includes("secr");
}

export function isPresident(role: string) {
  return role === "president" || role === "admin";
}

export function isTreasurerGeneral(role: string) {
  return role === "treasurer" || role === "president" || role === "admin";
}

export function canViewBudget(role: string, isSuperAdmin?: boolean) {
  return (
    isSuperAdmin ||
    ["admin", "president", "treasurer", "board"].includes(role)
  );
}

export function canManageBudget(role: string, isSuperAdmin?: boolean) {
  return isSuperAdmin || ["admin", "president", "treasurer"].includes(role);
}

export async function resolveSignoffCapabilities(
  userId: string,
  role: string,
  isSuperAdmin?: boolean,
) {
  if (isSuperAdmin) {
    return {
      canSignAsSG: true,
      canSignAsPresident: true,
      canSignAsTG: true,
      positionTitle: "Administrateur plateforme",
    };
  }
  const meta = await getUserRegistryMeta(userId);
  const positionTitle = meta?.position_title;
  return {
    canSignAsSG: isSecretaryGeneral(role, positionTitle),
    canSignAsPresident: isPresident(role),
    canSignAsTG: isTreasurerGeneral(role),
    positionTitle,
  };
}

export function budgetNeedsSignoffs(signoffs: { signoff_role: string }[]) {
  const roles = new Set(signoffs.map((s) => s.signoff_role));
  return {
    sg: roles.has("secretary_general"),
    president: roles.has("president"),
    treasurer: roles.has("treasurer"),
    complete:
      roles.has("secretary_general") &&
      roles.has("president") &&
      roles.has("treasurer"),
  };
}

export function expenseNeedsSignoffs(signoffs: { signoff_role: string; decision: string }[]) {
  const approved = signoffs.filter((s) => s.decision === "approved");
  const roles = new Set(approved.map((s) => s.signoff_role));
  return {
    sg: roles.has("secretary_general"),
    president: roles.has("president"),
    complete: roles.has("secretary_general") && roles.has("president"),
    rejected: signoffs.some((s) => s.decision === "rejected"),
  };
}
