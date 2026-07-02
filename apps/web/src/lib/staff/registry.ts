import { COMMITTEE_ROLES } from "@/lib/budget/constants";

export const AGENTS_BASE_PATH = "/dashboard/admin/agents";

export function staffMemberHref(
  phoneNormalized: string,
  options?: { from?: "comite" | "agents" },
) {
  const base = `${AGENTS_BASE_PATH}/${encodeURIComponent(phoneNormalized)}`;
  if (options?.from === "comite") {
    return `${base}?from=comite`;
  }
  return base;
}

export function isCommitteeMemberRole(role: string) {
  return (COMMITTEE_ROLES as readonly string[]).includes(role);
}

export function isAgentRole(role: string) {
  return role !== "parent" && !isCommitteeMemberRole(role);
}
