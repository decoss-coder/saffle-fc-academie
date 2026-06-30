import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { matriculeClass, navActionClass, rowCompact } from "@/lib/dashboard-ui";
import {
  DUE_STATUS_LABELS,
  formatFcfa,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/payments/constants";

export default async function JoueurCotisationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, matricule, first_name, last_name, photo_url, team")
    .eq("id", id)
    .maybeSingle();

  if (!player) notFound();

  const playerName = `${player.last_name} ${player.first_name}`;

  const { data: dues } = await supabase
    .from("player_dues")
    .select(
      "id, label, amount_due, amount_paid, remaining_amount, status, due_date, created_at",
    )
    .eq("player_id", id)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, amount, status, payment_method, created_at, paid_at, receipt_number",
    )
    .eq("player_id", id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title={`Cotisations — ${playerName}`}
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Joueurs", href: "/dashboard/joueurs" },
        { label: playerName, href: `/dashboard/joueurs/${player.id}` },
        { label: "Cotisations" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link
          href={`/dashboard/joueurs/${player.id}`}
          className={navActionClass}
        >
          Retour à la fiche
        </Link>
      }
    >
      <div className="flex items-center gap-4 rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
        <PlayerAvatar
          photoPath={player.photo_url}
          firstName={player.first_name}
          lastName={player.last_name}
          size="md"
        />
        <div>
          <p className="font-semibold text-green-900">{playerName}</p>
          <p className={matriculeClass}>{player.matricule}
            {player.team ? ` · ${player.team}` : ""}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">Historique des cotisations</h2>
        {!dues?.length ? (
          <EmptyState message="Aucune cotisation enregistrée pour ce joueur." />
        ) : (
          <DataTable
            count={
              <ListCount count={dues.length} label="cotisation" labelPlural="cotisations" />
            }
          >
            <DataTableHead>
              <tr>
                <DataTableTh>Libellé</DataTableTh>
                <DataTableTh>Montant</DataTableTh>
                <DataTableTh>Payé</DataTableTh>
                <DataTableTh>Reste</DataTableTh>
                <DataTableTh>Statut</DataTableTh>
                <DataTableTh>Échéance</DataTableTh>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {dues.map((due) => (
                <tr key={due.id}>
                  <td className={`${rowCompact} font-medium text-green-900`}>{due.label}</td>
                  <td className={rowCompact}>{formatFcfa(Number(due.amount_due))}</td>
                  <td className={rowCompact}>{formatFcfa(Number(due.amount_paid))}</td>
                  <td className={rowCompact}>{formatFcfa(Number(due.remaining_amount))}</td>
                  <td className={rowCompact}>
                    {DUE_STATUS_LABELS[due.status] ?? due.status}
                  </td>
                  <td className={`${rowCompact} text-slate-600`}>
                    {due.due_date
                      ? new Intl.DateTimeFormat("fr-CI").format(new Date(due.due_date))
                      : "—"}
                  </td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">Historique des paiements</h2>
        {!payments?.length ? (
          <EmptyState message="Aucun paiement enregistré." />
        ) : (
          <DataTable
            count={
              <ListCount count={payments.length} label="paiement" labelPlural="paiements" />
            }
          >
            <DataTableHead>
              <tr>
                <DataTableTh>Date</DataTableTh>
                <DataTableTh>Montant</DataTableTh>
                <DataTableTh>Méthode</DataTableTh>
                <DataTableTh>Statut</DataTableTh>
                <DataTableTh>Reçu</DataTableTh>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className={`${rowCompact} text-slate-600`}>
                    {new Intl.DateTimeFormat("fr-CI", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(payment.paid_at ?? payment.created_at))}
                  </td>
                  <td className={rowCompact}>{formatFcfa(Number(payment.amount))}</td>
                  <td className={rowCompact}>
                    {PAYMENT_METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                  </td>
                  <td className={rowCompact}>
                    {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                  </td>
                  <td className={`${rowCompact} ${matriculeClass}`}>
                    {payment.receipt_number ?? "—"}
                  </td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </section>
    </DashboardShell>
  );
}
