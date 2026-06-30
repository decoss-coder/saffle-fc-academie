import { DashboardShell } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { DueStatusBadge } from "@/components/due-status-badge";
import { StatusBadge } from "@/components/status-badge";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { rowCompact } from "@/lib/dashboard-ui";
import { formatFcfa, PAYMENT_STATUS_LABELS, paymentStatusVariant } from "@/lib/payments/constants";
import { requireCommitteeMember } from "@/lib/permissions";
import { initiateCommitteeWavePayment } from "../actions";

export default async function MesCotisationsComitePage({
  searchParams,
}: {
  searchParams: Promise<{ wave?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { profile, user } = await requireCommitteeMember();
  const supabase = await createClient();

  const { data: registry } = await supabase
    .from("phone_registry")
    .select("phone_normalized, full_name")
    .eq("linked_user_id", user.id)
    .maybeSingle();

  if (!registry) {
    return (
      <DashboardShell
        title="Mes cotisations comité"
        breadcrumbs={[
          { label: "Finance", href: "/dashboard" },
          { label: "Mes cotisations" },
        ]}
        userName={profile.full_name ?? "Utilisateur"}
        userRole={profile.role}
      >
        <EmptyState message="Compte non lié au registre du comité directeur." />
      </DashboardShell>
    );
  }

  const { data: dues } = await supabase
    .from("committee_dues")
    .select("id, label, amount_due, amount_paid, status, due_date")
    .eq("member_phone", registry.phone_normalized)
    .in("status", ["pending", "partial"])
    .order("due_date", { ascending: true });

  const { data: memberDues } = await supabase
    .from("committee_dues")
    .select("id")
    .eq("member_phone", registry.phone_normalized);

  const dueIds = (memberDues ?? []).map((d) => d.id);

  const { data: payments } = dueIds.length
    ? await supabase
        .from("committee_due_payments")
        .select("id, amount, status, payment_method, paid_at, receipt_number, committee_due_id")
        .in("committee_due_id", dueIds)
        .order("paid_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const { data: allMemberDues } = await supabase
    .from("committee_dues")
    .select("id, label")
    .eq("member_phone", registry.phone_normalized);

  const dueLabels = new Map(
    (allMemberDues ?? []).map((d) => [d.id, d.label]),
  );

  const waveMessage =
    params.wave === "success"
      ? "Paiement Wave effectué. Le trésorier confirmera sous peu."
      : params.wave === "error"
        ? "Paiement annulé ou échoué."
        : params.error
          ? "Une erreur est survenue."
          : null;

  return (
    <DashboardShell
      title="Mes cotisations comité"
      breadcrumbs={[
        { label: "Finance", href: "/dashboard" },
        { label: "Mes cotisations" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
    >
      <InfoBanner>
        Cotisations du comité directeur pour {registry.full_name}. Payez avec Wave
        ou consultez l&apos;historique.
      </InfoBanner>

      {waveMessage && <InfoBanner title="Wave">{waveMessage}</InfoBanner>}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-green-900">En cours</h2>
        {!dues?.length ? (
          <EmptyState message="Aucune cotisation en attente." />
        ) : (
          dues.map((due) => {
            const remaining = Number(due.amount_due) - Number(due.amount_paid);
            return (
              <article
                key={due.id}
                className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-green-900">{due.label}</h3>
                <p className="mt-2 text-sm text-green-700">
                  Reste : <strong>{formatFcfa(remaining)}</strong>
                  {" · "}
                  <DueStatusBadge status={due.status} />
                </p>
                {remaining >= 100 && (
                  <form action={initiateCommitteeWavePayment} className="mt-4">
                    <input type="hidden" name="due_id" value={due.id} />
                    <input type="hidden" name="amount" value={remaining} />
                    <input
                      type="hidden"
                      name="return_path"
                      value="/dashboard/comite/mes-cotisations"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-white"
                    >
                      Payer {formatFcfa(remaining)} avec Wave
                    </button>
                  </form>
                )}
              </article>
            );
          })
        )}
      </section>

      {!!payments?.length && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-green-900">Historique</h2>
          <DataTable
            count={
              <ListCount count={payments.length} label="paiement" labelPlural="paiements" />
            }
          >
            <DataTableHead>
              <tr>
                <DataTableTh>Date</DataTableTh>
                <DataTableTh>Cotisation</DataTableTh>
                <DataTableTh>Montant</DataTableTh>
                <DataTableTh>Statut</DataTableTh>
                <DataTableTh>Reçu</DataTableTh>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {payments.map((p) => (
                  <tr key={p.id}>
                    <td className={rowCompact}>
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleDateString("fr-CI")
                        : "—"}
                    </td>
                    <td className={rowCompact}>
                      {dueLabels.get(p.committee_due_id) ?? "—"}
                    </td>
                    <td className={rowCompact}>{formatFcfa(Number(p.amount))}</td>
                    <td className={rowCompact}>
                      <StatusBadge
                        label={PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                        variant={paymentStatusVariant(p.status)}
                      />
                    </td>
                    <td className={`${rowCompact} font-mono text-xs`}>
                      {p.receipt_number ?? "—"}
                    </td>
                  </tr>
                ))}
            </DataTableBody>
          </DataTable>
        </section>
      )}
    </DashboardShell>
  );
}
