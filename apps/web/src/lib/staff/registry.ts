import { COMMITTEE_ROLES } from "@/lib/budget/constants";
import { phoneToPathSegment } from "@/lib/phone";

export const AGENTS_BASE_PATH = "/dashboard/admin/agents";

export function staffMemberHref(
  phoneNormalized: string,
  options?: { from?: "comite" | "agents" },
) {
  const base = `${AGENTS_BASE_PATH}/${phoneToPathSegment(phoneNormalized)}`;
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
