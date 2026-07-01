import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardShell } from "@/components/dashboard-shell";
import { isSuperAdminIdentity } from "@/lib/super-admin";

export type UserProfile = {
  full_name: string | null;
  role: string;
  phone?: string | null;
  isSuperAdmin?: boolean;
};

export async function requireUser() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, phone")
    .eq("id", user.id)
    .maybeSingle();

  const base = (profile ?? { full_name: null, role: "parent", phone: null }) as UserProfile;
  const isSuperAdmin = isSuperAdminIdentity(base.phone, base.full_name);

  return {
    user,
    profile: {
      ...base,
      role: isSuperAdmin ? "admin" : base.role,
      isSuperAdmin,
    },
  };
}

function elevated(role: string, isSuperAdmin?: boolean) {
  return isSuperAdmin || role === "admin";
}

const MANAGE_PLAYERS_ROLES = new Set(["admin", "president", "coach"]);
const ADMIN_ROLES = new Set(["admin", "president"]);
const TREASURER_ROLES = new Set(["admin", "president", "treasurer"]);
const CONVOCATION_ROLES = new Set(["admin", "president", "coach"]);
const PARENT_ROLES = new Set(["parent"]);
const PLAYER_ACCOUNT_ROLES = new Set(["player_formation", "player_team_a"]);

export function canManagePlayers(role: string, isSuperAdmin?: boolean) {
  return elevated(role, isSuperAdmin) || MANAGE_PLAYERS_ROLES.has(role);
}

export function canManagePhones(role: string, isSuperAdmin?: boolean) {
  return elevated(role, isSuperAdmin) || ADMIN_ROLES.has(role);
}

export function canManagePayments(role: string, isSuperAdmin?: boolean) {
  return elevated(role, isSuperAdmin) || TREASURER_ROLES.has(role);
}

export function canManageConvocations(role: string, isSuperAdmin?: boolean) {
  return elevated(role, isSuperAdmin) || CONVOCATION_ROLES.has(role);
}

export function canManageClub(role: string, isSuperAdmin?: boolean) {
  return (
    elevated(role, isSuperAdmin) ||
    MANAGE_PLAYERS_ROLES.has(role) ||
    TREASURER_ROLES.has(role)
  );
}

export function canViewBudget(role: string, isSuperAdmin?: boolean) {
  return (
    elevated(role, isSuperAdmin) ||
    ["admin", "president", "treasurer", "board"].includes(role)
  );
}

export function canManageBudget(role: string, isSuperAdmin?: boolean) {
  return elevated(role, isSuperAdmin) || TREASURER_ROLES.has(role);
}

export function canApproveWelfare(role: string, isSuperAdmin?: boolean) {
  return elevated(role, isSuperAdmin) || ADMIN_ROLES.has(role);
}

export function isParentRole(role: string) {
  return PARENT_ROLES.has(role);
}

export function isPlayerAccountRole(role: string) {
  return PLAYER_ACCOUNT_ROLES.has(role);
}

export function canUploadDocuments(role: string) {
  return isParentRole(role) || isPlayerAccountRole(role);
}

export async function requireDocumentUploader() {
  const session = await requireUser();
  if (!canUploadDocuments(session.profile.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (!canManagePhones(session.profile.role, session.profile.isSuperAdmin)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireStaff() {
  const session = await requireUser();
  if (!canManagePlayers(session.profile.role, session.profile.isSuperAdmin)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireTreasurer() {
  const session = await requireUser();
  if (!canManagePayments(session.profile.role, session.profile.isSuperAdmin)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireConvocationStaff() {
  const session = await requireUser();
  if (
    !canManageConvocations(session.profile.role, session.profile.isSuperAdmin)
  ) {
    redirect("/dashboard");
  }
  return session;
}

export async function getLinkedPlayerIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: guardians } = await supabase
    .from("player_guardians")
    .select("player_id")
    .eq("guardian_id", userId);

  const { data: ownPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", userId)
    .eq("is_archived", false);

  const ids = new Set<string>();
  guardians?.forEach((g) => ids.add(g.player_id));
  ownPlayers?.forEach((p) => ids.add(p.id));
  return [...ids];
}

export { DashboardShell };
