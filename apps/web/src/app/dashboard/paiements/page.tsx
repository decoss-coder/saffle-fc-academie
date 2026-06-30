import { Suspense } from "react";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import {
  DUE_STATUS_LABELS,
  formatFcfa,
  PAYMENT_METHOD_LABELS,
} from "@/lib/payments/constants";
import { confirmPayment, createGroupDue } from "./actions";
import { CreateGroupDueForm } from "./create-group-due-form";
import { GroupTabs } from "@/components/group-tabs";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { ClickableTableRow, PlayerCellLink } from "@/components/clickable-table-row";
import { matriculeClass, rowCompact } from "@/lib/dashboard-ui";
import { unwrapRelation } from "@/lib/supabase/relation";
import { PaiementsTabs } from "./paiements-tabs";

const DEFAULT_GROUP = PLAYER_GROUPS[0].team;

function resolveGroup(groupe?: string) {
  const match = PLAYER_GROUPS.find((g) => g.team === groupe);
  return match?.team ?? DEFAULT_GROUP;
}

export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ wave?: string; groupe?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "creer" ? "creer" : "suivi";
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
      id, player_id, label, amount_due, amount_paid, remaining_amount, status, due_date,
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

  const tabItems = PLAYER_GROUPS.map((g) => ({
    key: g.team,
    label: g.team,
    count: openDuesByGroup[g.team] ?? 0,
    href: `/dashboard/paiements?tab=suivi&groupe=${encodeURIComponent(g.team)}`,
  }));

  return (
    <DashboardShell
      title="Paiements"
      breadcrumbs={[
        { label: "Finance", href: "/dashboard" },
        { label: "Paiements" },
        ...(activeGroup ? [{ label: activeGroup.label }] : []),
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
    >
      <InfoBanner>
        Suivez les cotisations ouvertes et confirmez les paiements Wave. Créez de
        nouvelles cotisations depuis l&apos;onglet Créer.
      </InfoBanner>

      {params.wave === "success" && (
        <InfoBanner title="Paiement Wave initié">
          Confirmez l&apos;encaissement dans l&apos;onglet Suivi une fois reçu.
        </InfoBanner>
      )}

      <Suspense fallback={<div className="h-10" />}>
        <PaiementsTabs activeTab={activeTab} />
      </Suspense>

      {activeTab === "creer" ? (
        <CreateGroupDueForm
          groupCounts={groupCounts}
          action={createGroupDue}
        />
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">
              Paiements Wave en attente
            </h2>
            {!pendingPayments?.length ? (
              <EmptyState message="Aucun paiement Wave en attente de confirmation." />
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
                        <p className="text-sm text-slate-600">
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
                <p className="mt-1 text-sm text-slate-600">
                  Suivi par catégorie — {activeGroup?.label ?? activeTeam}
                </p>
              </div>
              <GroupTabs
                items={tabItems}
                activeKey={activeTeam}
                variant="pill"
                ariaLabel="Catégories de cotisations"
              />
            </div>

            {!filteredDues.length ? (
              <EmptyState message={`Aucune cotisation ouverte pour ${activeTeam}.`} />
            ) : (
              <DataTable
                count={
                  <ListCount
                    count={filteredDues.length}
                    label="cotisation ouverte"
                    labelPlural="cotisations ouvertes"
                  />
                }
              >
                <DataTableHead>
                  <tr>
                    <DataTableTh>Joueur</DataTableTh>
                    <DataTableTh>Libellé</DataTableTh>
                    <DataTableTh>Montant</DataTableTh>
                    <DataTableTh>Reste</DataTableTh>
                    <DataTableTh>Échéance</DataTableTh>
                    <DataTableTh>Statut</DataTableTh>
                    <DataTableTh className="w-10" />
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredDues.map((due) => {
                    const player = unwrapRelation(due.players);
                    const playerHref = player
                      ? `/dashboard/joueurs/${due.player_id}/cotisations`
                      : "#";
                    return (
                      <ClickableTableRow key={due.id} href={playerHref}>
                        <PlayerCellLink href={playerHref}>
                          <div>
                            <p className="font-medium text-green-900">
                              {player
                                ? `${player.last_name} ${player.first_name}`
                                : "Joueur inconnu"}
                            </p>
                            {player?.matricule && (
                              <p className={matriculeClass}>{player.matricule}</p>
                            )}
                          </div>
                        </PlayerCellLink>
                        <td className={rowCompact}>{due.label}</td>
                        <td className={rowCompact}>
                          {formatFcfa(Number(due.amount_due))}
                        </td>
                        <td className={`${rowCompact} font-medium`}>
                          {formatFcfa(Number(due.remaining_amount))}
                        </td>
                        <td className={`${rowCompact} text-slate-600`}>
                          {due.due_date
                            ? new Intl.DateTimeFormat("fr-CI").format(
                                new Date(due.due_date),
                              )
                            : "—"}
                        </td>
                        <td className={rowCompact}>
                          {DUE_STATUS_LABELS[due.status] ?? due.status}
                        </td>
                      </ClickableTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            )}
          </section>
        </>
      )}
    </DashboardShell>
  );
}
