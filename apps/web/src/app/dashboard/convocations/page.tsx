import { DashboardShell, requireConvocationStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClickableCard } from "@/components/clickable-card";
import { EmptyState } from "@/components/empty-state";
import {
  formatDateTime,
  formatEventType,
  RESPONSE_STATUS_LABELS,
} from "@/lib/convocations/constants";
import { createConvocation } from "./actions";
import { CreateConvocationForm } from "./create-convocation-form";

export default async function ConvocationsPage() {
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
    .limit(20);

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
    >
      <CreateConvocationForm players={playerOptions} action={createConvocation} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">Convocations récentes</h2>
        {!convocations?.length ? (
          <EmptyState message="Aucune convocation." />
        ) : (
          <div className="space-y-3">
            {convocations.map((c) => (
              <ClickableCard key={c.id} href={`/dashboard/convocations/${c.id}`}>
                <p className="text-sm text-green-700">{formatEventType(c.event_type)}</p>
                <h3 className="text-lg font-semibold text-green-900">{c.title}</h3>
                <p className="mt-1 text-sm text-green-700">
                  {formatDateTime(c.event_date)}
                  {c.location ? ` · ${c.location}` : ""}
                </p>
              </ClickableCard>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
