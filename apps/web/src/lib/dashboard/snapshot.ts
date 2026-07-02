import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canManageConvocations,
  canManagePayments,
  canManagePhones,
  canManagePlayers,
  canManageClub,
  isParentRole,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { COMMITTEE_ROLES } from "@/lib/budget/constants";
import {
  buildParentAlerts,
  buildParentKpis,
  buildParentQuickActions,
  buildStaffAlerts,
  buildStaffKpis,
  buildStaffQuickActions,
  type DashboardSnapshot,
  type RawAlertCounts,
} from "./alerts";
import {
  fetchParentUpcomingEvents,
  fetchStaffUpcomingEvents,
} from "./events";
import { buildClubRhythm, computeRecoveryRate } from "./rhythm";

async function countUnreadNotifications(
  supabase: SupabaseClient,
  userId: string,
) {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

async function countPendingConvocationResponses(
  supabase: SupabaseClient,
  role: string,
) {
  if (!canManageConvocations(role)) return 0;

  const now = new Date().toISOString();
  const { data: upcomingConvocations } = await supabase
    .from("convocations")
    .select("id")
    .gte("event_date", now);

  const convocationIds = upcomingConvocations?.map((c) => c.id) ?? [];
  if (!convocationIds.length) return 0;

  const { count } = await supabase
    .from("convocation_entries")
    .select("*", { count: "exact", head: true })
    .in("convocation_id", convocationIds)
    .eq("response", "pending");

  return count ?? 0;
}

async function fetchRhythmRawCounts(
  supabase: SupabaseClient,
  role: string,
  pendingDocuments: number,
) {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const now = new Date().toISOString();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [weeklyAbsencesResult, monthDuesResult] = await Promise.all([
    canManagePlayers(role)
      ? supabase
          .from("convocation_entries")
          .select("*, convocations!inner(event_type, event_date)", {
            count: "exact",
            head: true,
          })
          .in("response", ["absent", "late"])
          .eq("convocations.event_type", "training")
          .gte("convocations.event_date", weekAgo)
          .lte("convocations.event_date", now)
      : Promise.resolve({ count: 0 }),
    canManagePayments(role)
      ? supabase
          .from("player_dues")
          .select("amount_due, amount_paid, status")
          .gte("created_at", monthStart.toISOString())
      : Promise.resolve({ data: [] }),
  ]);

  const { recoveryRate, hasMonthDues } = computeRecoveryRate(
    monthDuesResult.data ?? [],
  );

  return {
    weeklyAbsences: weeklyAbsencesResult.count ?? 0,
    pendingDocuments,
    recoveryRate,
    hasMonthDues,
  };
}

async function fetchRawCounts(
  supabase: SupabaseClient,
  role: string,
  userId: string,
  playerIds: string[],
): Promise<RawAlertCounts> {
  const certLimit = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [
    { count: activePlayers },
    { count: pendingWavePayments },
    { count: pendingDocuments },
    { count: unactivatedMembers },
    { count: unactivatedParents },
    { count: overdueDues },
    { count: expiringMedicalCerts },
    unreadNotifications,
    pendingConvocationResponses,
    { count: parentPendingConvocations },
    { count: parentPendingDues },
  ] = await Promise.all([
    supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false),
    canManagePayments(role)
      ? supabase
          .from("payments")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("payment_method", "wave")
      : Promise.resolve({ count: 0 }),
    canManagePlayers(role)
      ? supabase
          .from("player_documents")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
      : Promise.resolve({ count: 0 }),
    canManagePhones(role)
      ? supabase
          .from("phone_registry")
          .select("*", { count: "exact", head: true })
          .is("linked_user_id", null)
          .neq("role", "parent")
          .not(
            "role",
            "in",
            `(${COMMITTEE_ROLES.map((r) => `"${r}"`).join(",")})`,
          )
      : Promise.resolve({ count: 0 }),
    canManagePlayers(role)
      ? supabase
          .from("phone_registry")
          .select("*", { count: "exact", head: true })
          .is("linked_user_id", null)
          .eq("role", "parent")
      : Promise.resolve({ count: 0 }),
    canManagePayments(role)
      ? supabase
          .from("player_dues")
          .select("*", { count: "exact", head: true })
          .eq("status", "overdue")
      : Promise.resolve({ count: 0 }),
    canManageClub(role)
      ? supabase
          .from("players")
          .select("*", { count: "exact", head: true })
          .eq("is_archived", false)
          .not("medical_cert_expires_at", "is", null)
          .lte("medical_cert_expires_at", certLimit)
      : Promise.resolve({ count: 0 }),
    countUnreadNotifications(supabase, userId),
    countPendingConvocationResponses(supabase, role),
    playerIds.length
      ? supabase
          .from("convocation_entries")
          .select("*", { count: "exact", head: true })
          .in("player_id", playerIds)
          .eq("response", "pending")
      : Promise.resolve({ count: 0 }),
    playerIds.length
      ? supabase
          .from("player_dues")
          .select("*", { count: "exact", head: true })
          .in("player_id", playerIds)
          .in("status", ["pending", "partial", "overdue"])
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    activePlayers: activePlayers ?? 0,
    pendingWavePayments: pendingWavePayments ?? 0,
    pendingDocuments: pendingDocuments ?? 0,
    unactivatedMembers: unactivatedMembers ?? 0,
    unactivatedParents: unactivatedParents ?? 0,
    overdueDues: overdueDues ?? 0,
    expiringMedicalCerts: expiringMedicalCerts ?? 0,
    unreadNotifications,
    pendingConvocationResponses,
    linkedChildren: playerIds.length,
    parentPendingConvocations: parentPendingConvocations ?? 0,
    parentPendingDues: parentPendingDues ?? 0,
  };
}

export async function fetchDashboardSnapshot(
  supabase: SupabaseClient,
  role: string,
  userId: string,
): Promise<DashboardSnapshot> {
  const linkedPlayerIds = await getLinkedPlayerIds(supabase, userId);

  const counts = await fetchRawCounts(supabase, role, userId, linkedPlayerIds);

  if (isParentRole(role)) {
    const alerts = buildParentAlerts(counts);
    const upcomingEvents = await fetchParentUpcomingEvents(supabase, linkedPlayerIds);

    return {
      kpis: buildParentKpis(counts, alerts.length),
      alerts,
      upcomingEvents,
      rhythm: [],
      quickActions: buildParentQuickActions(),
    };
  }

  const alerts = buildStaffAlerts(role, counts);
  const [upcomingEvents, rhythmCounts] = await Promise.all([
    fetchStaffUpcomingEvents(supabase, role),
    fetchRhythmRawCounts(supabase, role, counts.pendingDocuments),
  ]);

  const quickActions = buildStaffQuickActions(role);
  if (!isParentRole(role) && linkedPlayerIds.length > 0) {
    quickActions.unshift({
      label: "Mes enfants",
      href: "/dashboard/parent",
    });
  }

  return {
    kpis: buildStaffKpis(role, counts, alerts.length),
    alerts,
    upcomingEvents,
    rhythm: buildClubRhythm(role, rhythmCounts),
    quickActions,
  };
}
