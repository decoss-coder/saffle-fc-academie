import Link from "next/link";
import { DashboardShell, requireConvocationStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { formatCategory } from "@/lib/players/constants";
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
    .select("id, first_name, last_name, matricule, category")
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
      label: `${p.last_name} ${p.first_name} · ${formatCategory(p.category)}`,
      category: p.category,
    })) ?? [];

  return (
    <DashboardShell
      title="Convocations"
      subtitle={`Entraînements et matchs — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <CreateConvocationForm players={playerOptions} action={createConvocation} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">Convocations récentes</h2>
        {!convocations?.length ? (
          <p className="text-sm text-green-700">Aucune convocation.</p>
        ) : (
          <div className="space-y-3">
            {convocations.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/convocations/${c.id}`}
                className="block rounded-2xl border border-green-200 bg-white p-5 shadow-sm transition hover:border-green-400 hover:bg-green-50"
              >
                <p className="text-sm text-green-700">{formatEventType(c.event_type)}</p>
                <h3 className="text-lg font-semibold text-green-900">{c.title}</h3>
                <p className="mt-1 text-sm text-green-700">
                  {formatDateTime(c.event_date)}
                  {c.location ? ` · ${c.location}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
