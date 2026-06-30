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

export function canManagePlayers(role: string) {
  return MANAGE_PLAYERS_ROLES.has(role);
}

export function canManagePhones(role: string) {
  return ADMIN_ROLES.has(role);
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

export { DashboardShell };
