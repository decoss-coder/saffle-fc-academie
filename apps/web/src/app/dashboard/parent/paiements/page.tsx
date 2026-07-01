import {
  DashboardShell,
  requireUser,
  canAccessFamilyPortal,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatFcfa,
  PAYMENT_STATUS_LABELS,
  paymentStatusVariant,
} from "@/lib/payments/constants";
import { initiateWavePayment } from "@/app/dashboard/paiements/actions";
import { redirect } from "next/navigation";
import { unwrapRelation } from "@/lib/supabase/relation";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { DueStatusBadge } from "@/components/due-status-badge";
import { StatusBadge } from "@/components/status-badge";
import { matriculeClass } from "@/lib/dashboard-ui";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { rowCompact } from "@/lib/dashboard-ui";
import { ReceiptLink } from "@/app/dashboard/paiements/payment-history-client";

export default async function ParentPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ wave?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  if (!(await canAccessFamilyPortal(supabase, user.id, profile.role))) {
    redirect("/dashboard");
  }

  const playerIds = await getLinkedPlayerIds(supabase, user.id);

  const { data: dues } = playerIds.length
    ? await supabase
        .from("player_dues")
        .select(
          `
          id, label, amount_due, amount_paid, remaining_amount, status, due_date,
          players ( first_name, last_name, matricule )
        `,
        )
        .in("player_id", playerIds)
        .in("status", ["pending", "partial", "overdue"])
        .order("due_date", { ascending: true })
    : { data: [] };

  const { data: recentPayments } = playerIds.length
    ? await supabase
        .from("payments")
        .select("id, amount, status, payment_method, created_at, receipt_number")
        .in("player_id", playerIds)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const waveMessage =
    params.wave === "success"
      ? "Paiement Wave effectué. Le trésorier confirmera sous peu."
      : params.wave === "error"
        ? "Le paiement Wave a été annulé ou a échoué."
        : params.error
          ? "Une erreur est survenue. Réessayez."
          : null;

  return (
    <DashboardShell
      title="Paiements"
      breadcrumbs={[
        { label: "Famille", href: "/dashboard" },
        { label: "Paiements" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <InfoBanner>
        Payez les cotisations de vos enfants avec Wave. Le trésorier confirmera
        chaque encaissement.
      </InfoBanner>

      {waveMessage && (
        <InfoBanner title="Wave">{waveMessage}</InfoBanner>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-green-900">Cotisations en cours</h2>
        {!dues?.length ? (
          <EmptyState message="Aucune cotisation en attente." />
        ) : (
          dues.map((due) => {
            const player = unwrapRelation(due.players);
            const remaining = Number(due.remaining_amount);
            return (
              <article
                key={due.id}
                className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-green-700">
                  {player
                    ? `${player.last_name} ${player.first_name}`
                    : "Joueur"}
                  {player?.matricule && (
                    <span className={`ml-2 ${matriculeClass}`}>{player.matricule}</span>
                  )}
                </p>
                <h3 className="text-lg font-semibold text-green-900">{due.label}</h3>
                <p className="mt-2 text-sm text-green-700">
                  Reste à payer :{" "}
                  <strong>{formatFcfa(remaining)}</strong>
                  {" · "}
                  <DueStatusBadge status={due.status} />
                </p>
                {remaining >= 100 && (
                  <form action={initiateWavePayment} className="mt-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="due_id" value={due.id} />
                    <input type="hidden" name="amount" value={remaining} />
                    <input type="hidden" name="return_path" value="/dashboard/parent/paiements" />
                    <button
                      type="submit"
                      className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700"
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

      {!!recentPayments?.length && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-green-900">Historique récent</h2>
          <DataTable
            count={
              <ListCount
                count={recentPayments.length}
                label="paiement"
                labelPlural="paiements"
              />
            }
          >
            <DataTableHead>
              <tr>
                <DataTableTh>Date</DataTableTh>
                <DataTableTh>Montant</DataTableTh>
                <DataTableTh>Statut</DataTableTh>
                <DataTableTh>Reçu</DataTableTh>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {recentPayments.map((p) => (
                <tr key={p.id}>
                  <td className={rowCompact}>
                    {new Date(p.created_at).toLocaleDateString("fr-CI")}
                  </td>
                  <td className={rowCompact}>{formatFcfa(Number(p.amount))}</td>
                  <td className={rowCompact}>
                    <StatusBadge
                      label={PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                      variant={paymentStatusVariant(p.status)}
                    />
                  </td>
                  <td className={rowCompact}>
                    <ReceiptLink paymentId={p.id} receiptNumber={p.receipt_number} />
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
