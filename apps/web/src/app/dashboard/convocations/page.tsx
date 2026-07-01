import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell, requireConvocationStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InfoBanner } from "@/components/info-banner";
import { primaryActionClass } from "@/lib/dashboard-ui";
import { createConvocation } from "./actions";
import { CreateConvocationForm } from "./create-convocation-form";
import { ConvocationsTabs } from "./convocations-tabs";
import {
  ConvocationsList,
  type ConvocationListItem,
} from "./convocations-list";

function aggregateConvocations(
  convocations: Array<{
    id: string;
    title: string;
    event_type: string;
    event_date: string;
    location: string | null;
  }>,
  entries: Array<{ convocation_id: string; response: string }> | null,
): ConvocationListItem[] {
  const stats = new Map<string, { invited: number; pending: number }>();

  for (const entry of entries ?? []) {
    const current = stats.get(entry.convocation_id) ?? { invited: 0, pending: 0 };
    current.invited += 1;
    if (entry.response === "pending") current.pending += 1;
    stats.set(entry.convocation_id, current);
  }

  return convocations.map((convocation) => {
    const itemStats = stats.get(convocation.id) ?? { invited: 0, pending: 0 };
    return {
      ...convocation,
      invited: itemStats.invited,
      pending: itemStats.pending,
      responded: itemStats.invited - itemStats.pending,
    };
  });
}

export default async function ConvocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "creer" ? "creer" : "liste";

  const { user, profile } = await requireConvocationStaff();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, matricule, category, team")
    .eq("is_archived", false)
    .order("last_name");

  const { data: convocations } = await supabase
    .from("convocations")
    .select("id, title, event_type, event_date, location")
    .order("event_date", { ascending: false })
    .limit(50);

  const convocationIds = convocations?.map((c) => c.id) ?? [];
  const { data: entries } = convocationIds.length
    ? await supabase
        .from("convocation_entries")
        .select("convocation_id, response")
        .in("convocation_id", convocationIds)
    : { data: [] };

  const allConvocations = aggregateConvocations(convocations ?? [], entries);
  const now = Date.now();
  const upcoming = allConvocations
    .filter((c) => new Date(c.event_date).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
    );
  const past = allConvocations
    .filter((c) => new Date(c.event_date).getTime() <= now)
    .sort(
      (a, b) =>
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime(),
    );

  const playerOptions =
    players?.map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      matricule: p.matricule,
      category: p.category,
      team: p.team,
    })) ?? [];

  return (
    <DashboardShell
      title="Convocations"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Convocations" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        activeTab === "liste" ? (
          <Link
            href="/dashboard/convocations?tab=creer"
            className={primaryActionClass}
          >
            Nouvelle convocation
          </Link>
        ) : undefined
      }
    >
      <Suspense fallback={<div className="h-10" />}>
        <ConvocationsTabs
          activeTab={activeTab}
          listCount={allConvocations.length}
        />
      </Suspense>

      {activeTab === "creer" ? (
        <div className="space-y-4">
          <InfoBanner title="Créer une convocation">
            <p>
              Renseignez la date, le lieu et les joueurs convoqués. Les parents
              recevront la convocation dans leur espace et pourront y répondre.
            </p>
          </InfoBanner>
          <CreateConvocationForm
            players={playerOptions}
            action={createConvocation}
            expanded
          />
        </div>
      ) : (
        <ConvocationsList upcoming={upcoming} past={past} />
      )}
    </DashboardShell>
  );
}
