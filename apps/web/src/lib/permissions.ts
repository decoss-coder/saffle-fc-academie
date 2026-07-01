import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COMMITTEE_ROLES } from "@/lib/budget/constants";
import { requireUser, type UserProfile } from "@/lib/auth";

const FINANCE_MANAGER_ROLES = new Set(["admin", "president", "treasurer"]);
const FINANCE_VIEWER_ROLES = new Set([
  "admin",
  "president",
  "treasurer",
  "board",
  "communication",
  "logistics",
]);

export function canManageFinance(role: string, isSuperAdmin?: boolean) {
  return isSuperAdmin || FINANCE_MANAGER_ROLES.has(role);
}

export function canViewFinance(role: string, isSuperAdmin?: boolean) {
  return isSuperAdmin || FINANCE_VIEWER_ROLES.has(role);
}

export function canManageSalaries(role: string, isSuperAdmin?: boolean) {
  return isSuperAdmin || FINANCE_MANAGER_ROLES.has(role);
}

export function canViewSalaries(role: string, isSuperAdmin?: boolean) {
  return isSuperAdmin || FINANCE_MANAGER_ROLES.has(role);
}

export function isCommitteeRegistryRole(role: string) {
  return (COMMITTEE_ROLES as readonly string[]).includes(role);
}

export async function getLinkedRegistryPhone(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("phone_registry")
    .select("phone_normalized, role, full_name, position_title")
    .eq("linked_user_id", userId)
    .maybeSingle();
  return data;
}

export async function isCommitteeMember(userId: string, isSuperAdmin?: boolean) {
  if (isSuperAdmin) return true;
  const registry = await getLinkedRegistryPhone(userId);
  if (!registry) return false;
  return isCommitteeRegistryRole(registry.role);
}

export async function requireFinanceViewer() {
  const session = await requireUser();
  if (!canViewFinance(session.profile.role, session.profile.isSuperAdmin)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireFinanceManager() {
  const session = await requireUser();
  if (!canManageFinance(session.profile.role, session.profile.isSuperAdmin)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireSalaryViewer() {
  const session = await requireUser();
  if (!canViewSalaries(session.profile.role, session.profile.isSuperAdmin)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireSalaryManager() {
  const session = await requireUser();
  if (!canManageSalaries(session.profile.role, session.profile.isSuperAdmin)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireCommitteeMember() {
  const session = await requireUser();
  const member = await isCommitteeMember(
    session.user.id,
    session.profile.isSuperAdmin,
  );
  if (!member) {
    redirect("/dashboard");
  }
  return session;
}

export type FinanceSession = {
  user: { id: string; email?: string };
  profile: UserProfile;
  canManage: boolean;
};

export async function requireFinanceSession(): Promise<FinanceSession> {
  const session = await requireFinanceViewer();
  return {
    ...session,
    canManage: canManageFinance(
      session.profile.role,
      session.profile.isSuperAdmin,
    ),
  };
}
