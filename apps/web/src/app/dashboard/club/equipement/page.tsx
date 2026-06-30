import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_STATUS_LABELS } from "@/lib/club-modules/constants";
import { ClubSection } from "@/components/club-ui";
import { PlayerAvatar } from "@/components/player-avatar";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import {
  ClickableTableRow,
  PlayerCellLink,
} from "@/components/clickable-table-row";
import { matriculeClass, navActionClass, rowCompact } from "@/lib/dashboard-ui";
import { EquipmentForms } from "./equipment-client";
import { unwrapRelation } from "@/lib/supabase/relation";

export default async function EquipementPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string }>;
}) {
  const { groupe } = await searchParams;
  const { profile } = await requireStaff();
  const supabase = await createClient();

  let playerQuery = supabase
    .from("players")
    .select("id, first_name, last_name, matricule, team, photo_url")
    .eq("is_archived", false)
    .order("last_name");
  if (groupe) playerQuery = playerQuery.eq("team", groupe);

  const { data: players } = await playerQuery;
  const { data: equipment } = await supabase
    .from("player_equipment")
    .select("*, players(first_name, last_name, team, matricule, photo_url)");
  const { data: inventory } = await supabase
    .from("equipment_inventory")
    .select("*")
    .order("created_at", { ascending: false });

  const playerOptions =
    players?.map((p) => ({
      id: p.id,
      label: `${p.last_name} ${p.first_name} (${p.matricule})`,
      team: p.team,
    })) ?? [];

  const filteredEquipment = groupe
    ? equipment?.filter((e) => unwrapRelation(e.players)?.team === groupe)
    : equipment;

  const rows = filteredEquipment ?? [];

  return (
    <DashboardShell
      title="Équipement"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club", href: "/dashboard/club" },
        { label: "Équipement" },
        ...(groupe ? [{ label: groupe }] : []),
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link
          href="/dashboard/club"
          className={navActionClass}
        >
          Retour
        </Link>
      }
    >
      <EquipmentForms players={playerOptions} inventory={inventory ?? []} />

      <ClubSection title="État par joueur">
        <DataTable
          count={
            <ListCount count={rows.length} label="joueur" labelPlural="joueurs" />
          }
        >
          <DataTableHead>
            <tr>
              <DataTableTh>Joueur</DataTableTh>
              <DataTableTh>Maillot</DataTableTh>
              <DataTableTh>Short</DataTableTh>
              <DataTableTh>Protège-tibias</DataTableTh>
              <DataTableTh>Pointure</DataTableTh>
              <DataTableTh className="w-10" />
            </tr>
          </DataTableHead>
          <DataTableBody>
            {rows.map((row) => {
              const p = unwrapRelation(row.players);
              const href = `/dashboard/joueurs/${row.player_id}`;
              return (
                <ClickableTableRow key={row.player_id} href={href}>
                  <PlayerCellLink href={href}>
                    <div className="flex items-center gap-3">
                      {p ? (
                        <>
                          <PlayerAvatar
                            photoPath={p.photo_url}
                            firstName={p.first_name}
                            lastName={p.last_name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-green-900">
                              {p.last_name} {p.first_name}
                            </p>
                            <p className={matriculeClass}>{p.matricule}</p>
                          </div>
                        </>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </PlayerCellLink>
                  <td className={rowCompact}>
                    {EQUIPMENT_STATUS_LABELS[row.jersey_status]}
                  </td>
                  <td className={rowCompact}>
                    {EQUIPMENT_STATUS_LABELS[row.shorts_status]}
                  </td>
                  <td className={rowCompact}>
                    {EQUIPMENT_STATUS_LABELS[row.shin_guards_status]}
                  </td>
                  <td className={rowCompact}>{row.shoe_size ?? "—"}</td>
                </ClickableTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
      </ClubSection>
    </DashboardShell>
  );
}
