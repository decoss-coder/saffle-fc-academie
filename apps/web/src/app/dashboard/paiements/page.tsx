import Link from "next/link";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import {
  DUE_STATUS_LABELS,
  formatFcfa,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/payments/constants";
import { confirmPayment, createPlayerDue } from "./actions";
import { CreateDueForm } from "./create-due-form";
import { unwrapRelation } from "@/lib/supabase/relation";

export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ wave?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await requireTreasurer();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, matricule")
    .eq("is_archived", false)
    .order("last_name");

  const { data: pendingPayments } = await supabase
    .from("payments")
    .select(
      `
      id, amount, status, payment_method, created_at, wave_checkout_url,
      players ( first_name, last_name ),
      player_dues ( label )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: dues } = await supabase
    .from("player_dues")
    .select(
      `
      id, label, amount_due, amount_paid, remaining_amount, status,
      players ( first_name, last_name, matricule )
    `,
    )
    .in("status", ["pending", "partial", "overdue"])
    .order("created_at", { ascending: false })
    .limit(20);

  const playerOptions =
    players?.map((p) => ({
      id: p.id,
      label: `${p.last_name} ${p.first_name} (${p.matricule})`,
    })) ?? [];

  return (
    <DashboardShell
      title="Paiements"
      subtitle={`Cotisations et Wave FCFA — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      {params.wave === "success" && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Paiement Wave initié. Confirmez l&apos;encaissement ci-dessous une fois reçu.
        </p>
      )}

      <CreateDueForm players={playerOptions} action={createPlayerDue} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">
          Paiements Wave en attente de confirmation
        </h2>
        {!pendingPayments?.length ? (
          <p className="text-sm text-green-700">Aucun paiement en attente.</p>
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((payment) => {
              const player = unwrapRelation(payment.players);
              const due = unwrapRelation(payment.player_dues);
              return (
              <article
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
              >
                <div>
                  <p className="font-medium text-green-900">
                    {formatFcfa(Number(payment.amount))} ·{" "}
                    {player
                      ? `${player.last_name} ${player.first_name}`
                      : "Joueur"}
                  </p>
                  <p className="text-sm text-green-700">
                    {due?.label ?? "Cotisation"} ·{" "}
                    {PAYMENT_METHOD_LABELS[payment.payment_method]}
                  </p>
                </div>
                <form action={confirmPayment}>
                  <input type="hidden" name="payment_id" value={payment.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Confirmer l&apos;encaissement
                  </button>
                </form>
              </article>
            );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">Cotisations ouvertes</h2>
        <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-green-800 text-green-100">
              <tr>
                <th className="px-4 py-3 text-left">Joueur</th>
                <th className="px-4 py-3 text-left">Libellé</th>
                <th className="px-4 py-3 text-left">Reste</th>
                <th className="px-4 py-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {!dues?.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-green-700">
                    Aucune cotisation ouverte.
                  </td>
                </tr>
              ) : (
                dues.map((due) => {
                  const player = unwrapRelation(due.players);
                  return (
                  <tr key={due.id}>
                    <td className="px-4 py-3">
                      {player
                        ? `${player.last_name} ${player.first_name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{due.label}</td>
                    <td className="px-4 py-3">
                      {formatFcfa(Number(due.remaining_amount))}
                    </td>
                    <td className="px-4 py-3">
                      {DUE_STATUS_LABELS[due.status] ?? due.status}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
