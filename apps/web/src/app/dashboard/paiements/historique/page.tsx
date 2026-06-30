import { Suspense } from "react";
import { DashboardShell } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatFcfa,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  paymentStatusVariant,
} from "@/lib/payments/constants";
import { InfoBanner } from "@/components/info-banner";
import { FinanceReadOnlyBanner } from "@/components/finance-read-only-banner";
import { StatusBadge } from "@/components/status-badge";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { rowCompact } from "@/lib/dashboard-ui";
import { unwrapRelation } from "@/lib/supabase/relation";
import { requireFinanceSession } from "@/lib/permissions";
import { PaiementsTabs } from "../paiements-tabs";
import { CancelPaymentForm, ReceiptLink } from "../payment-history-client";

export default async function PaiementsHistoriquePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; method?: string }>;
}) {
  const params = await searchParams;
  const { profile, canManage } = await requireFinanceSession();
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select(
      `
      id, amount, status, payment_method, created_at, paid_at, receipt_number, payer_name,
      players ( first_name, last_name, matricule ),
      player_dues ( label )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.status) query = query.eq("status", params.status);
  if (params.method) query = query.eq("payment_method", params.method);

  const { data: payments } = await query;

  return (
    <DashboardShell
      title="Historique des paiements"
      breadcrumbs={[
        { label: "Finance", href: "/dashboard" },
        { label: "Paiements", href: "/dashboard/paiements" },
        { label: "Historique" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
    >
      {!canManage && <FinanceReadOnlyBanner />}

      <InfoBanner>
        Historique complet des paiements joueurs. Les annulations exigent un motif.
      </InfoBanner>

      <Suspense fallback={<div className="h-10" />}>
        <PaiementsTabs activeTab="historique" canManage={canManage} />
      </Suspense>

      <div className="flex flex-wrap gap-2 text-sm">
        <a href="/dashboard/paiements/historique" className="rounded-full border border-green-300 px-3 py-1 text-green-800">
          Tous
        </a>
        {(["pending", "completed", "cancelled"] as const).map((s) => (
          <a
            key={s}
            href={`/dashboard/paiements/historique?status=${s}`}
            className="rounded-full border border-green-300 px-3 py-1 text-green-800"
          >
            {PAYMENT_STATUS_LABELS[s]}
          </a>
        ))}
      </div>

      {!payments?.length ? (
        <p className="text-sm text-slate-600">Aucun paiement.</p>
      ) : (
        <DataTable
          count={
            <ListCount count={payments.length} label="paiement" labelPlural="paiements" />
          }
        >
          <DataTableHead>
            <tr>
              <DataTableTh>Date</DataTableTh>
              <DataTableTh>Joueur</DataTableTh>
              <DataTableTh>Cotisation</DataTableTh>
              <DataTableTh>Montant</DataTableTh>
              <DataTableTh>Méthode</DataTableTh>
              <DataTableTh>Payeur</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
              <DataTableTh>Reçu</DataTableTh>
              {canManage && <DataTableTh>Actions</DataTableTh>}
            </tr>
          </DataTableHead>
          <DataTableBody>
            {payments.map((p) => {
              const player = unwrapRelation(p.players);
              const due = unwrapRelation(p.player_dues);
              return (
                <tr key={p.id} className="border-b border-green-100">
                  <td className={rowCompact}>
                    {new Date(p.created_at).toLocaleDateString("fr-CI")}
                  </td>
                  <td className={rowCompact}>
                    {player
                      ? `${player.last_name} ${player.first_name}`
                      : "—"}
                  </td>
                  <td className={rowCompact}>{due?.label ?? "—"}</td>
                  <td className={rowCompact}>{formatFcfa(Number(p.amount))}</td>
                  <td className={rowCompact}>
                    {PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method}
                  </td>
                  <td className={rowCompact}>{p.payer_name ?? "—"}</td>
                  <td className={rowCompact}>
                    <StatusBadge
                      label={PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                      variant={paymentStatusVariant(p.status)}
                    />
                  </td>
                  <td className={rowCompact}>
                    <ReceiptLink paymentId={p.id} receiptNumber={p.receipt_number} />
                  </td>
                  {canManage && (
                    <td className={rowCompact}>
                      {p.status === "completed" && (
                        <CancelPaymentForm paymentId={p.id} />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </DataTableBody>
        </DataTable>
      )}
    </DashboardShell>
  );
}
