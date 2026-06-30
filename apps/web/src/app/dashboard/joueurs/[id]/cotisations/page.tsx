import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PlayerAvatar } from "@/components/player-avatar";
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
      title={`Cotisations — ${player.last_name} ${player.first_name}`}
      subtitle={player.matricule}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link
          href={`/dashboard/joueurs/${player.id}`}
          className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800 hover:bg-green-50"
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
          <p className="font-semibold text-green-900">
            {player.last_name} {player.first_name}
          </p>
          <p className="text-sm text-green-700">
            {player.matricule}
            {player.team ? ` · ${player.team}` : ""}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">Historique des cotisations</h2>
        {!dues?.length ? (
          <p className="rounded-2xl border border-dashed border-green-300 bg-white p-6 text-sm text-green-700">
            Aucune cotisation enregistrée pour ce joueur.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-green-800 text-green-100">
                <tr>
                  <th className="px-4 py-3 text-left">Libellé</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Payé</th>
                  <th className="px-4 py-3 text-left">Reste</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Échéance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {dues.map((due) => (
                  <tr key={due.id}>
                    <td className="px-4 py-3 font-medium text-green-900">{due.label}</td>
                    <td className="px-4 py-3">{formatFcfa(Number(due.amount_due))}</td>
                    <td className="px-4 py-3">{formatFcfa(Number(due.amount_paid))}</td>
                    <td className="px-4 py-3">{formatFcfa(Number(due.remaining_amount))}</td>
                    <td className="px-4 py-3">
                      {DUE_STATUS_LABELS[due.status] ?? due.status}
                    </td>
                    <td className="px-4 py-3 text-green-700">
                      {due.due_date
                        ? new Intl.DateTimeFormat("fr-CI").format(new Date(due.due_date))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">Historique des paiements</h2>
        {!payments?.length ? (
          <p className="rounded-2xl border border-dashed border-green-300 bg-white p-6 text-sm text-green-700">
            Aucun paiement enregistré.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-green-800 text-green-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Méthode</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-green-700">
                      {new Intl.DateTimeFormat("fr-CI", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(payment.paid_at ?? payment.created_at))}
                    </td>
                    <td className="px-4 py-3">{formatFcfa(Number(payment.amount))}</td>
                    <td className="px-4 py-3">
                      {PAYMENT_METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                    </td>
                    <td className="px-4 py-3">
                      {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                    </td>
                    <td className="px-4 py-3 font-mono text-green-700">
                      {payment.receipt_number ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
