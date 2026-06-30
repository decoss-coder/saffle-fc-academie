import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell, requireUser, canManagePlayers } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import {
  summarizeAttendanceStatus,
  summarizePaymentStatus,
} from "@/lib/players/list-status";
import { LiveSearch } from "@/components/live-search";
import { GroupTabs } from "@/components/group-tabs";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { unwrapRelation } from "@/lib/supabase/relation";
import { EmptyState } from "@/components/empty-state";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  ListCount,
  SortableTh,
} from "@/components/data-table";
import { ClickableTableRow, PlayerCellLink } from "@/components/clickable-table-row";
import { matriculeClass, primaryActionClass, rowCompact, type SortDir } from "@/lib/dashboard-ui";

const DEFAULT_GROUP = PLAYER_GROUPS[0].team;

function resolveGroup(groupe?: string) {
  const match = PLAYER_GROUPS.find((g) => g.team === groupe);
  return match?.team ?? DEFAULT_GROUP;
}

function matchesSearch(
  player: { first_name: string; last_name: string; matricule: string },
  query?: string,
) {
  const needle = query?.trim().toLowerCase();
  if (!needle) return true;
  const fullName = `${player.last_name} ${player.first_name}`.toLowerCase();
  return (
    player.first_name.toLowerCase().includes(needle) ||
    player.last_name.toLowerCase().includes(needle) ||
    player.matricule.toLowerCase().includes(needle) ||
    fullName.includes(needle)
  );
}

function buildLatestAttendance(
  entries: Array<{
    player_id: string;
    response: string;
    convocations:
      | { event_type: string; event_date: string; title: string }
      | { event_type: string; event_date: string; title: string }[]
      | null;
  }>,
) {
  const latestByPlayer = new Map<
    string,
    { response: string; sessionTitle: string; sessionDate: string }
  >();
  const now = Date.now();

  for (const entry of entries) {
    const convocation = unwrapRelation(entry.convocations);
    if (!convocation || convocation.event_type !== "training") continue;
    if (new Date(convocation.event_date).getTime() > now) continue;

    const existing = latestByPlayer.get(entry.player_id);
    if (
      !existing ||
      new Date(convocation.event_date).getTime() >
        new Date(existing.sessionDate).getTime()
    ) {
      latestByPlayer.set(entry.player_id, {
        response: entry.response,
        sessionTitle: convocation.title,
        sessionDate: convocation.event_date,
      });
    }
  }

  return latestByPlayer;
}

type PlayerRow = {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  paymentStatus: ReturnType<typeof summarizePaymentStatus>;
  attendanceStatus: ReturnType<typeof summarizeAttendanceStatus>;
};

function sortPlayers(
  rows: PlayerRow[],
  sort?: string,
  dir: SortDir = "asc",
): PlayerRow[] {
  const factor = dir === "asc" ? 1 : -1;
  const sorted = [...rows];

  sorted.sort((a, b) => {
    if (sort === "cotisation") {
      return a.paymentStatus.label.localeCompare(b.paymentStatus.label, "fr") * factor;
    }
    if (sort === "presence") {
      return a.attendanceStatus.label.localeCompare(b.attendanceStatus.label, "fr") * factor;
    }
    const nameA = `${a.last_name} ${a.first_name}`;
    const nameB = `${b.last_name} ${b.first_name}`;
    return nameA.localeCompare(nameB, "fr") * factor;
  });

  return sorted;
}

export default async function JoueursPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string; q?: string; sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const activeTeam = resolveGroup(params.groupe);
  const searchQuery = params.q?.trim() ?? "";
  const sort = params.sort ?? "name";
  const dir: SortDir = params.dir === "desc" ? "desc" : "asc";

  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select(
      "id, matricule, first_name, last_name, team, photo_url",
    )
    .eq("is_archived", false)
    .order("last_name", { ascending: true });

  const allPlayers = players ?? [];
  const counts = Object.fromEntries(
    PLAYER_GROUPS.map((g) => [
      g.team,
      allPlayers.filter((p) => p.team === g.team).length,
    ]),
  );

  const teamPlayers = allPlayers.filter((p) => p.team === activeTeam);
  const playerIds = teamPlayers.map((p) => p.id);

  const { data: dues } = playerIds.length
    ? await supabase
        .from("player_dues")
        .select("player_id, status, remaining_amount")
        .in("player_id", playerIds)
    : { data: [] };

  const { data: attendanceEntries } = playerIds.length
    ? await supabase
        .from("convocation_entries")
        .select(
          `player_id, response, convocations ( event_type, event_date, title )`,
        )
        .in("player_id", playerIds)
    : { data: [] };

  const duesByPlayer = new Map<
    string,
    Array<{ player_id: string; status: string; remaining_amount: number | null }>
  >();
  for (const due of dues ?? []) {
    const list = duesByPlayer.get(due.player_id) ?? [];
    list.push(due);
    duesByPlayer.set(due.player_id, list);
  }

  const attendanceByPlayer = buildLatestAttendance(attendanceEntries ?? []);

  const rows: PlayerRow[] = teamPlayers
    .filter((p) => matchesSearch(p, searchQuery))
    .map((player) => ({
      id: player.id,
      matricule: player.matricule,
      first_name: player.first_name,
      last_name: player.last_name,
      photo_url: player.photo_url,
      paymentStatus: summarizePaymentStatus(duesByPlayer.get(player.id) ?? []),
      attendanceStatus: summarizeAttendanceStatus(
        attendanceByPlayer.get(player.id),
      ),
    }));

  const sorted = sortPlayers(rows, sort, dir);
  const activeGroup = PLAYER_GROUPS.find((g) => g.team === activeTeam);
  const canManage = canManagePlayers(profile.role);
  const listParams = {
    groupe: activeTeam,
    q: searchQuery || undefined,
  };

  const tabItems = PLAYER_GROUPS.map((g) => ({
    key: g.team,
    label: g.team,
    count: counts[g.team] ?? 0,
    href: `/dashboard/joueurs?groupe=${encodeURIComponent(g.team)}${
      searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
    }`,
  }));

  return (
    <DashboardShell
      title="Joueurs"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Joueurs" },
        ...(activeGroup ? [{ label: activeGroup.label }] : []),
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        canManage ? (
          <Link
            href={`/dashboard/joueurs/nouveau?groupe=${encodeURIComponent(activeTeam)}`}
            className={primaryActionClass}
          >
            Nouveau joueur
          </Link>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3 border-b border-green-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <GroupTabs items={tabItems} activeKey={activeTeam} ariaLabel="Groupes de joueurs" />
        <Suspense fallback={null}>
          <LiveSearch preserveParams={["groupe"]} />
        </Suspense>
      </div>

      <div className="mt-4">
        {!sorted.length ? (
          <EmptyState
            message={
              searchQuery
                ? `Aucun joueur trouvé pour « ${searchQuery} ».`
                : `Aucun joueur dans ${activeGroup?.label ?? activeTeam} pour le moment.`
            }
          >
            {canManage && !searchQuery && (
              <Link
                href={`/dashboard/joueurs/nouveau?groupe=${encodeURIComponent(activeTeam)}`}
                className="inline-flex rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white"
              >
                Ajouter un joueur
              </Link>
            )}
          </EmptyState>
        ) : (
          <DataTable
            count={
              <ListCount count={sorted.length} label="joueur" labelPlural="joueurs" />
            }
          >
            <DataTableHead>
              <tr>
                <SortableTh
                  label="Joueur"
                  sortKey="name"
                  basePath="/dashboard/joueurs"
                  params={listParams}
                  currentSort={sort}
                  currentDir={dir}
                />
                <SortableTh
                  label="Cotisation"
                  sortKey="cotisation"
                  basePath="/dashboard/joueurs"
                  params={listParams}
                  currentSort={sort}
                  currentDir={dir}
                />
                <SortableTh
                  label="Dernière séance"
                  sortKey="presence"
                  basePath="/dashboard/joueurs"
                  params={listParams}
                  currentSort={sort}
                  currentDir={dir}
                />
                <th className="w-10" aria-hidden />
              </tr>
            </DataTableHead>
            <DataTableBody>
              {sorted.map((player) => (
                <ClickableTableRow
                  key={player.id}
                  href={`/dashboard/joueurs/${player.id}`}
                >
                  <PlayerCellLink href={`/dashboard/joueurs/${player.id}`}>
                    <div className="flex items-center gap-3">
                      <PlayerAvatar
                        photoPath={player.photo_url}
                        firstName={player.first_name}
                        lastName={player.last_name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-green-900">
                          {player.last_name} {player.first_name}
                        </p>
                        <p className={matriculeClass}>{player.matricule}</p>
                      </div>
                    </div>
                  </PlayerCellLink>
                  <td className={rowCompact}>
                    <PlayerStatusBadge
                      status={player.paymentStatus}
                      href={`/dashboard/joueurs/${player.id}/cotisations`}
                    />
                  </td>
                  <td className={rowCompact}>
                    <PlayerStatusBadge
                      status={player.attendanceStatus}
                      href={`/dashboard/joueurs/${player.id}/presences`}
                    />
                  </td>
                </ClickableTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </div>
    </DashboardShell>
  );
}
