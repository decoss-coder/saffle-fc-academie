import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DashboardShell } from "@/components/dashboard-shell";

export type UserProfile = {
  full_name: string | null;
  role: string;
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
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: (profile ?? { full_name: null, role: "parent" }) as UserProfile,
  };
}

const MANAGE_PLAYERS_ROLES = new Set(["admin", "president", "coach"]);
const ADMIN_ROLES = new Set(["admin", "president"]);
const TREASURER_ROLES = new Set(["admin", "president", "treasurer"]);
const CONVOCATION_ROLES = new Set(["admin", "president", "coach"]);
const PARENT_ROLES = new Set(["parent"]);
const PLAYER_ACCOUNT_ROLES = new Set(["player_formation", "player_team_a"]);

export function canManagePlayers(role: string) {
  return MANAGE_PLAYERS_ROLES.has(role);
}

export function canManagePhones(role: string) {
  return ADMIN_ROLES.has(role);
}

export function canManagePayments(role: string) {
  return TREASURER_ROLES.has(role);
}

export function canManageConvocations(role: string) {
  return CONVOCATION_ROLES.has(role);
}

export function canManageClub(role: string) {
  return MANAGE_PLAYERS_ROLES.has(role) || TREASURER_ROLES.has(role);
}

export function canApproveWelfare(role: string) {
  return ADMIN_ROLES.has(role);
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
  if (!canManagePhones(session.profile.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireStaff() {
  const session = await requireUser();
  if (!canManagePlayers(session.profile.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireTreasurer() {
  const session = await requireUser();
  if (!canManagePayments(session.profile.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireConvocationStaff() {
  const session = await requireUser();
  if (!canManageConvocations(session.profile.role)) {
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
