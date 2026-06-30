import {
  DashboardShell,
  requireUser,
  isParentRole,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import {
  DUE_STATUS_LABELS,
  formatFcfa,
  PAYMENT_STATUS_LABELS,
} from "@/lib/payments/constants";
import { initiateWavePayment } from "@/app/dashboard/paiements/actions";
import { redirect } from "next/navigation";
import { unwrapRelation } from "@/lib/supabase/relation";

export default async function ParentPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ wave?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await requireUser();
  if (!isParentRole(profile.role)) redirect("/dashboard");

  const supabase = await createClient();
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
      subtitle={`Cotisations et Wave (FCFA) — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      {waveMessage && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {waveMessage}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-green-900">Cotisations en cours</h2>
        {!dues?.length ? (
          <p className="rounded-2xl border border-dashed border-green-300 bg-white p-8 text-center text-green-700">
            Aucune cotisation en attente.
          </p>
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
                    ? `${player.last_name} ${player.first_name} · ${player.matricule}`
                    : "Joueur"}
                </p>
                <h3 className="text-lg font-semibold text-green-900">{due.label}</h3>
                <p className="mt-2 text-sm text-green-700">
                  Reste à payer :{" "}
                  <strong>{formatFcfa(remaining)}</strong> ·{" "}
                  {DUE_STATUS_LABELS[due.status] ?? due.status}
                </p>
                {remaining >= 100 && (
                  <form action={initiateWavePayment} className="mt-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="due_id" value={due.id} />
                    <input type="hidden" name="amount" value={remaining} />
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
          <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-green-800 text-green-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {recentPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      {new Date(p.created_at).toLocaleDateString("fr-CI")}
                    </td>
                    <td className="px-4 py-3">{formatFcfa(Number(p.amount))}</td>
                    <td className="px-4 py-3">
                      {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.receipt_number ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
