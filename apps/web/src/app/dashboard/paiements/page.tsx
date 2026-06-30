import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import {
  DUE_STATUS_LABELS,
  formatFcfa,
  PAYMENT_METHOD_LABELS,
} from "@/lib/payments/constants";
import { confirmPayment, createGroupDue } from "./actions";
import { CreateGroupDueForm } from "./create-group-due-form";
import { PaymentsGroupTabs } from "@/components/payments-group-tabs";
import { unwrapRelation } from "@/lib/supabase/relation";

const DEFAULT_GROUP = PLAYER_GROUPS[0].team;

function resolveGroup(groupe?: string) {
  const match = PLAYER_GROUPS.find((g) => g.team === groupe);
  return match?.team ?? DEFAULT_GROUP;
}

export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ wave?: string; groupe?: string }>;
}) {
  const params = await searchParams;
  const activeTeam = resolveGroup(params.groupe);

  const { profile } = await requireTreasurer();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, team")
    .eq("is_archived", false);

  const groupCounts = Object.fromEntries(
    PLAYER_GROUPS.map((g) => [
      g.team,
      (players ?? []).filter((p) => p.team === g.team).length,
    ]),
  );

  const { data: pendingPayments } = await supabase
    .from("payments")
    .select(
      `
      id, amount, status, payment_method, created_at, wave_checkout_url,
      players ( first_name, last_name, team ),
      player_dues ( label )
    `,
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: allOpenDues } = await supabase
    .from("player_dues")
    .select(
      `
      id, label, amount_due, amount_paid, remaining_amount, status, due_date,
      players ( first_name, last_name, matricule, team )
    `,
    )
    .in("status", ["pending", "partial", "overdue"])
    .order("created_at", { ascending: false });

  const openDuesByGroup = Object.fromEntries(
    PLAYER_GROUPS.map((g) => [g.team, 0]),
  );
  for (const due of allOpenDues ?? []) {
    const player = unwrapRelation(due.players);
    if (player?.team && player.team in openDuesByGroup) {
      openDuesByGroup[player.team] += 1;
    }
  }

  const filteredDues = (allOpenDues ?? []).filter((due) => {
    const player = unwrapRelation(due.players);
    return player?.team === activeTeam;
  });

  const activeGroup = PLAYER_GROUPS.find((g) => g.team === activeTeam);

  return (
    <DashboardShell
      title="Paiements"
      subtitle={`${activeGroup?.label ?? activeTeam} — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      {params.wave === "success" && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Paiement Wave initié. Confirmez l&apos;encaissement dans la section
          ci-dessous une fois reçu.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Création
        </h2>
        <CreateGroupDueForm
          groupCounts={groupCounts}
          action={createGroupDue}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Paiements Wave en attente
        </h2>
        {!pendingPayments?.length ? (
          <p className="rounded-2xl border border-dashed border-green-300 bg-white p-6 text-sm text-green-700">
            Aucun paiement Wave en attente de confirmation.
          </p>
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
                      {player?.team ? ` · ${player.team}` : ""}
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

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Cotisations ouvertes
            </h2>
            <p className="mt-1 text-sm text-green-700">
              Suivi par catégorie — {activeGroup?.label ?? activeTeam}
            </p>
          </div>
          <PaymentsGroupTabs activeTeam={activeTeam} counts={openDuesByGroup} />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-green-800 text-green-100">
              <tr>
                <th className="px-4 py-3 text-left">Joueur</th>
                <th className="px-4 py-3 text-left">Matricule</th>
                <th className="px-4 py-3 text-left">Libellé</th>
                <th className="px-4 py-3 text-left">Montant</th>
                <th className="px-4 py-3 text-left">Reste</th>
                <th className="px-4 py-3 text-left">Échéance</th>
                <th className="px-4 py-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {!filteredDues.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-green-700"
                  >
                    Aucune cotisation ouverte pour {activeTeam}.
                  </td>
                </tr>
              ) : (
                filteredDues.map((due) => {
                  const player = unwrapRelation(due.players);
                  return (
                    <tr key={due.id} className="hover:bg-green-50">
                      <td className="px-4 py-3 font-medium text-green-900">
                        {player
                          ? `${player.last_name} ${player.first_name}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-green-700">
                        {player?.matricule ?? "—"}
                      </td>
                      <td className="px-4 py-3">{due.label}</td>
                      <td className="px-4 py-3">
                        {formatFcfa(Number(due.amount_due))}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatFcfa(Number(due.remaining_amount))}
                      </td>
                      <td className="px-4 py-3 text-green-700">
                        {due.due_date
                          ? new Intl.DateTimeFormat("fr-CI").format(
                              new Date(due.due_date),
                            )
                          : "—"}
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
