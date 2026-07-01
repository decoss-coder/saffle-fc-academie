import {
  DashboardShell,
  requireUser,
  canAccessFamilyPortal,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatDateTime,
  formatEventType,
  RESPONSE_STATUS_LABELS,
} from "@/lib/convocations/constants";
import { respondConvocation } from "@/app/dashboard/convocations/actions";
import { ConvocationResponseForm } from "@/components/convocation-response-form";
import { redirect } from "next/navigation";
import { unwrapRelation } from "@/lib/supabase/relation";
import { EmptyState } from "@/components/empty-state";

export default async function ParentConvocationsPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  if (!(await canAccessFamilyPortal(supabase, user.id, profile.role))) {
    redirect("/dashboard");
  }

  const playerIds = await getLinkedPlayerIds(supabase, user.id);

  const { data: entries } = playerIds.length
    ? await supabase
        .from("convocation_entries")
        .select(
          `
          id, response, response_comment,
          players ( id, first_name, last_name, matricule ),
          convocations ( id, title, event_type, event_date, location, notes )
        `,
        )
        .in("player_id", playerIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const sorted = [...(entries ?? [])].sort((a, b) => {
    const dateA = unwrapRelation(a.convocations)?.event_date ?? "";
    const dateB = unwrapRelation(b.convocations)?.event_date ?? "";
    return dateA.localeCompare(dateB);
  });

  return (
    <DashboardShell
      title="Convocations"
      breadcrumbs={[
        { label: "Famille", href: "/dashboard" },
        { label: "Convocations" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      {!sorted.length ? (
        <EmptyState message="Aucune convocation pour le moment." />
      ) : (
        <div className="space-y-4">
          {sorted.map((entry) => {
            const conv = unwrapRelation(entry.convocations);
            const player = unwrapRelation(entry.players);
            if (!conv || !player) return null;

            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-green-700">
                      {formatEventType(conv.event_type)} ·{" "}
                      {player.last_name} {player.first_name}
                    </p>
                    <h2 className="text-xl font-semibold text-green-900">
                      {conv.title}
                    </h2>
                    <p className="mt-1 text-sm text-green-700">
                      {formatDateTime(conv.event_date)}
                      {conv.location ? ` · ${conv.location}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm ${
                      entry.response === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {RESPONSE_STATUS_LABELS[entry.response] ?? entry.response}
                  </span>
                </div>
                {conv.notes && (
                  <p className="mt-3 text-sm text-green-800">{conv.notes}</p>
                )}
                {entry.response_comment && (
                  <p className="mt-2 text-sm italic text-green-700">
                    Votre commentaire : {entry.response_comment}
                  </p>
                )}
                {entry.response === "pending" && (
                  <ConvocationResponseForm
                    entryId={entry.id}
                    action={respondConvocation}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
