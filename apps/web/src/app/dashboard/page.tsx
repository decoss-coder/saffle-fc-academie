import {
  DashboardShell,
  requireUser,
  isParentRole,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { AlertInbox } from "@/components/dashboard/alert-inbox";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { ClubRhythm } from "@/components/dashboard/club-rhythm";
import { QuickActionsBar } from "@/components/dashboard/quick-actions-bar";

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const role = profile.role;

  const snapshot = await fetchDashboardSnapshot(supabase, role, user.id);

  return (
    <DashboardShell
      title={`Bonjour ${profile.full_name || "!"}`}
      breadcrumbs={[
        { label: "Pilotage", href: "/dashboard" },
        { label: "Accueil" },
      ]}
      subtitle={
        isParentRole(role)
          ? "Suivez les enfants, les convocations et les cotisations sans perdre le fil."
          : "Une console claire pour décider vite et agir proprement."
      }
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={role}
    >
      <KpiStrip items={snapshot.kpis} />
      <AlertInbox alerts={snapshot.alerts} />
      <UpcomingEvents
        events={snapshot.upcomingEvents}
        title={
          isParentRole(role)
            ? "Prochaines convocations"
            : "Prochains événements"
        }
      />
      {snapshot.rhythm.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <ClubRhythm metrics={snapshot.rhythm} />
          <QuickActionsBar actions={snapshot.quickActions} />
        </section>
      ) : (
        <QuickActionsBar actions={snapshot.quickActions} />
      )}
    </DashboardShell>
  );
}
