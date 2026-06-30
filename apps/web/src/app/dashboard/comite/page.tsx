import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { COMMITTEE_ROLES } from "@/lib/budget/constants";
import { formatRole } from "@/lib/roles";
import { ClubSection } from "@/components/club-ui";
import { BulkDueForm, DueStatus, PaymentForm, SingleDueForm, formatFcfa } from "./comite-client";

export default async function ComitePage() {
  const { profile } = await requireTreasurer();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("phone_registry")
    .select("phone_normalized, full_name, role, position_title")
    .in("role", [...COMMITTEE_ROLES])
    .order("full_name");

  const { data: dues } = await supabase
    .from("committee_dues")
    .select("*, phone_registry(full_name, role, position_title)")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title="Comité directeur"
      subtitle={`Cotisations membres — ${CLUB.name}`}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link href="/dashboard/budget" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">
          Budget
        </Link>
      }
    >
      <p className="rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-800">
        Cotisations des membres du comité directeur, gérées par le trésorier.
        Les encaissements peuvent être reportés manuellement dans le budget actif (recette « cotisation comité »).
      </p>

      <BulkDueForm />
      <SingleDueForm
        members={
          (members ?? []).map((m) => ({
            phone: m.phone_normalized,
            label: `${m.full_name ?? "—"} — ${formatRole(m.role, m.position_title)}`,
          }))
        }
      />

      <ClubSection title="Membres du comité">
        <div className="grid gap-2 sm:grid-cols-2">
          {(members ?? []).map((m) => (
            <div key={m.phone_normalized} className="rounded-xl border border-green-200 bg-white p-3 text-sm">
              <p className="font-medium text-green-900">{m.full_name}</p>
              <p className="text-green-700">{formatRole(m.role, m.position_title)}</p>
            </div>
          ))}
        </div>
      </ClubSection>

      <ClubSection title="Cotisations">
        <div className="space-y-4">
          {(dues ?? []).map((d) => {
            const member = d.phone_registry as {
              full_name?: string;
              position_title?: string;
            } | null;
            const remaining = Number(d.amount_due) - Number(d.amount_paid);
            return (
              <article key={d.id} className="rounded-2xl border border-green-200 bg-white p-4 text-sm">
                <p className="font-medium text-green-900">
                  {member?.full_name ?? "—"} · {d.label}
                </p>
                <p className="text-green-700">
                  {formatFcfa(Number(d.amount_paid))} / {formatFcfa(Number(d.amount_due))}
                  {" · "}
                  <DueStatus status={d.status} />
                </p>
                {remaining > 0 && (
                  <PaymentForm dueId={d.id} label={d.label} remaining={remaining} />
                )}
              </article>
            );
          })}
          {!dues?.length && (
            <p className="text-sm text-green-700">Aucune cotisation comité.</p>
          )}
        </div>
      </ClubSection>
    </DashboardShell>
  );
}
