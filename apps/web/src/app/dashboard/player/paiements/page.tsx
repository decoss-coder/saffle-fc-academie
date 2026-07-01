import { Suspense } from "react";
import {
  DashboardShell,
  requireUser,
  isPlayerAccountRole,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatFcfa,
  PAYMENT_STATUS_LABELS,
  paymentStatusVariant,
} from "@/lib/payments/constants";
import { initiateWavePayment } from "@/app/dashboard/paiements/actions";
import { redirect } from "next/navigation";
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
import { ParentPaiementsTabs } from "@/app/dashboard/parent/parent-paiements-tabs";

export default async function PlayerPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ wave?: string; error?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "historique" ? "historique" : "en-cours";
  const { user, profile } = await requireUser();
  if (!isPlayerAccountRole(profile.role)) redirect("/dashboard");

  const canPay = profile.role === "player_team_a";
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, first_name, last_name, matricule, team")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .maybeSingle();

  if (!player) {
    return (
      <DashboardShell
        title="Mes paiements"
        breadcrumbs={[{ label: "Parent", href: "/dashboard/parent" }, { label: "Paiements" }]}
        userName={profile.full_name || user.email || "Utilisateur"}
        userRole={profile.role}
      >
        <EmptyState message="Aucun profil joueur lié à votre compte." />
      </DashboardShell>
    );
  }

  const { data: dues } = await supabase
    .from("player_dues")
    .select("id, label, remaining_amount, status, due_date")
    .eq("player_id", player.id)
    .in("status", ["pending", "partial", "overdue"])
    .order("due_date", { ascending: true });

  const { data: recentPayments } = await supabase
    .from("payments")
    .select("id, amount, status, created_at, receipt_number")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false })
    .limit(10);

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
      title="Mes paiements"
      breadcrumbs={[
        { label: "Parent", href: "/dashboard/parent" },
        { label: "Paiements" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <InfoBanner>
        {canPay
          ? "Consultez vos cotisations et payez avec Wave."
          : "Consultation seule — les paiements sont gérés par votre parent ou tuteur."}
      </InfoBanner>

      {waveMessage && <InfoBanner title="Wave">{waveMessage}</InfoBanner>}

      <p className="text-sm text-green-800">
        {player.last_name} {player.first_name}
        <span className={`ml-2 ${matriculeClass}`}>{player.matricule}</span>
        {player.team ? ` · ${player.team}` : ""}
      </p>

      <Suspense fallback={<div className="h-10" />}>
        <ParentPaiementsTabs
          activeTab={activeTab}
          pendingCount={dues?.length ?? 0}
          historyCount={recentPayments?.length ?? 0}
        />
      </Suspense>

      {activeTab === "en-cours" ? (
      <section className="space-y-4">
        {!dues?.length ? (
          <EmptyState message="Aucune cotisation en attente." />
        ) : (
          dues.map((due) => {
            const remaining = Number(due.remaining_amount);
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
                {canPay && remaining >= 100 && (
                  <form action={initiateWavePayment} className="mt-4">
                    <input type="hidden" name="due_id" value={due.id} />
                    <input type="hidden" name="amount" value={remaining} />
                    <input type="hidden" name="return_path" value="/dashboard/player/paiements" />
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
      ) : !recentPayments?.length ? (
        <EmptyState message="Aucun paiement enregistré pour le moment." />
      ) : (
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
      )}
    </DashboardShell>
  );
}
