import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import {
  formatFcfa,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  paymentStatusVariant,
} from "@/lib/payments/constants";
import { confirmPayment, createGroupDue, createIndividualDue } from "./actions";
import { CreateGroupDueForm } from "./create-group-due-form";
import { CreateIndividualDueForm } from "./create-individual-due-form";
import { GroupTabs } from "@/components/group-tabs";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { FinanceReadOnlyBanner } from "@/components/finance-read-only-banner";
import { DueStatusBadge } from "@/components/due-status-badge";
import { StatusBadge } from "@/components/status-badge";
import { LiveSearch } from "@/components/live-search";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
  SortableTh,
} from "@/components/data-table";
import { ClickableTableRow, PlayerCellLink } from "@/components/clickable-table-row";
import { matriculeClass, rowCompact, type SortDir } from "@/lib/dashboard-ui";
import { unwrapRelation } from "@/lib/supabase/relation";
import { requireFinanceSession } from "@/lib/permissions";
import { PaiementsTabs } from "./paiements-tabs";

const DEFAULT_GROUP = PLAYER_GROUPS[0].team;

function resolveGroup(groupe?: string) {
  const match = PLAYER_GROUPS.find((g) => g.team === groupe);
  return match?.team ?? DEFAULT_GROUP;
}

type DueRow = {
  id: string;
  player_id: string;
  label: string;
  amount_due: number;
  remaining_amount: number;
  status: string;
  due_date: string | null;
  playerName: string;
  matricule: string;
  team: string;
};

function sortDues(
  rows: DueRow[],
  sort: string,
  dir: SortDir,
): DueRow[] {
  const mult = dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    switch (sort) {
      case "label":
        return mult * a.label.localeCompare(b.label, "fr");
      case "amount":
        return mult * (a.amount_due - b.amount_due);
      case "remaining":
        return mult * (a.remaining_amount - b.remaining_amount);
      case "due_date": {
        const da = a.due_date ? new Date(a.due_date).getTime() : 0;
        const db = b.due_date ? new Date(b.due_date).getTime() : 0;
        return mult * (da - db);
      }
      case "status":
        return mult * a.status.localeCompare(b.status, "fr");
      default:
        return mult * a.playerName.localeCompare(b.playerName, "fr");
    }
  });
}

export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    wave?: string;
    groupe?: string;
    tab?: string;
    q?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const params = await searchParams;
  const { profile, canManage } = await requireFinanceSession();
  const activeTab =
    params.tab === "creer" && canManage
      ? "creer"
      : params.tab === "historique"
        ? "historique"
        : "suivi";
  const activeTeam = resolveGroup(params.groupe);
  const sort = params.sort ?? "player";
  const dir: SortDir = params.dir === "desc" ? "desc" : "asc";
  const query = params.q?.trim().toLowerCase() ?? "";

  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, team, first_name, last_name, matricule")
    .eq("is_archived", false)
    .order("last_name");

  const groupCounts = Object.fromEntries(
    PLAYER_GROUPS.map((g) => [
      g.team,
      (players ?? []).filter((p) => p.team === g.team).length,
    ]),
  );

  const playerOptions = (players ?? []).map((p) => ({
    id: p.id,
    label: `${p.last_name} ${p.first_name} · ${p.matricule} · ${p.team ?? ""}`,
  }));

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

  const dueRows: DueRow[] = (allOpenDues ?? [])
    .map((due) => {
      const player = unwrapRelation(due.players);
      if (player?.team !== activeTeam) return null;
      const playerName = player
        ? `${player.last_name} ${player.first_name}`
        : "Joueur inconnu";
      if (
        query &&
        !playerName.toLowerCase().includes(query) &&
        !due.label.toLowerCase().includes(query) &&
        !(player?.matricule ?? "").toLowerCase().includes(query)
      ) {
        return null;
      }
      return {
        id: due.id,
        player_id: due.player_id,
        label: due.label,
        amount_due: Number(due.amount_due),
        remaining_amount: Number(due.remaining_amount),
        status: due.status,
        due_date: due.due_date,
        playerName,
        matricule: player?.matricule ?? "",
        team: player?.team ?? "",
      };
    })
    .filter((r): r is DueRow => r !== null);

  const filteredDues = sortDues(dueRows, sort, dir);
  const activeGroup = PLAYER_GROUPS.find((g) => g.team === activeTeam);
  const basePath = "/dashboard/paiements";
  const listParams = {
    tab: "suivi",
    groupe: activeTeam,
    q: params.q,
  };

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
      {!canManage && <FinanceReadOnlyBanner />}

      <InfoBanner>
        Suivez les cotisations ouvertes et confirmez les paiements Wave.
        {canManage && " Créez de nouvelles cotisations depuis l'onglet Créer."}
      </InfoBanner>

      {params.wave === "success" && canManage && (
        <InfoBanner title="Paiement Wave initié">
          Confirmez l&apos;encaissement dans l&apos;onglet Suivi une fois reçu.
        </InfoBanner>
      )}

      <Suspense fallback={<div className="h-10" />}>
        <PaiementsTabs activeTab={activeTab} canManage={canManage} />
      </Suspense>

      {activeTab === "creer" && canManage ? (
        <div className="space-y-6">
          <CreateGroupDueForm groupCounts={groupCounts} action={createGroupDue} />
          <CreateIndividualDueForm players={playerOptions} action={createIndividualDue} />
        </div>
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
                      <div className="space-y-1">
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
                        <StatusBadge
                          label={PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                          variant={paymentStatusVariant(payment.status)}
                        />
                        {payment.wave_checkout_url && (
                          <a
                            href={payment.wave_checkout_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-green-800 underline"
                          >
                            Ouvrir le lien Wave
                          </a>
                        )}
                      </div>
                      {canManage && (
                        <form action={confirmPayment}>
                          <input type="hidden" name="payment_id" value={payment.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
                          >
                            Confirmer l&apos;encaissement
                          </button>
                        </form>
                      )}
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

            <LiveSearch placeholder="Rechercher joueur ou libellé…" preserveParams={["groupe", "tab"]} />

            {!filteredDues.length ? (
              <EmptyState message={`Aucune cotisation ouverte pour ${activeTeam}.`}>
                {canManage && (
                  <Link
                    href={`/dashboard/paiements?tab=creer&groupe=${encodeURIComponent(activeTeam)}`}
                    className="inline-block rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Créer une cotisation →
                  </Link>
                )}
              </EmptyState>
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
                    <SortableTh
                      label="Joueur"
                      sortKey="player"
                      currentSort={sort}
                      currentDir={dir}
                      basePath={basePath}
                      params={listParams}
                    />
                    <SortableTh
                      label="Libellé"
                      sortKey="label"
                      currentSort={sort}
                      currentDir={dir}
                      basePath={basePath}
                      params={listParams}
                    />
                    <SortableTh
                      label="Montant"
                      sortKey="amount"
                      currentSort={sort}
                      currentDir={dir}
                      basePath={basePath}
                      params={listParams}
                    />
                    <SortableTh
                      label="Reste"
                      sortKey="remaining"
                      currentSort={sort}
                      currentDir={dir}
                      basePath={basePath}
                      params={listParams}
                    />
                    <SortableTh
                      label="Échéance"
                      sortKey="due_date"
                      currentSort={sort}
                      currentDir={dir}
                      basePath={basePath}
                      params={listParams}
                    />
                    <SortableTh
                      label="Statut"
                      sortKey="status"
                      currentSort={sort}
                      currentDir={dir}
                      basePath={basePath}
                      params={listParams}
                    />
                    <DataTableTh className="w-10" />
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {filteredDues.map((due) => {
                    const playerHref = `/dashboard/joueurs/${due.player_id}/cotisations`;
                    return (
                      <ClickableTableRow key={due.id} href={playerHref}>
                        <PlayerCellLink href={playerHref}>
                          <div>
                            <p className="font-medium text-green-900">{due.playerName}</p>
                            {due.matricule && (
                              <p className={matriculeClass}>{due.matricule}</p>
                            )}
                          </div>
                        </PlayerCellLink>
                        <td className={rowCompact}>{due.label}</td>
                        <td className={rowCompact}>{formatFcfa(due.amount_due)}</td>
                        <td className={`${rowCompact} font-medium`}>
                          {formatFcfa(due.remaining_amount)}
                        </td>
                        <td className={`${rowCompact} text-slate-600`}>
                          {due.due_date
                            ? new Intl.DateTimeFormat("fr-CI").format(
                                new Date(due.due_date),
                              )
                            : "—"}
                        </td>
                        <td className={rowCompact}>
                          <DueStatusBadge status={due.status} />
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
