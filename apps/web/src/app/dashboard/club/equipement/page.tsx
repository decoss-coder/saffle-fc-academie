import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EQUIPMENT_STATUS_LABELS } from "@/lib/club-modules/constants";
import { ClubSection } from "@/components/club-ui";
import { ClubModuleTabs, resolveClubTab } from "@/components/club-module-tabs";
import { InfoBanner } from "@/components/info-banner";
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
import { matriculeClass, navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import {
  InventoryForm,
  LoanEquipmentForm,
  PlayerEquipmentForm,
} from "./equipment-client";
import { unwrapRelation } from "@/lib/supabase/relation";

const TABS = ["suivi", "fiche", "inventaire", "pret"] as const;

export default async function EquipementPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "suivi");
  const { groupe } = params;

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
  const loanedCount =
    inventory?.filter((i) => i.status === "loaned").length ?? 0;

  const tabHref = (tab: string) => {
    const qs = new URLSearchParams();
    if (groupe) qs.set("groupe", groupe);
    if (tab !== "suivi") qs.set("tab", tab);
    const s = qs.toString();
    return s
      ? `/dashboard/club/equipement?${s}`
      : "/dashboard/club/equipement";
  };

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
        activeTab === "suivi" ? (
          <Link href={tabHref("fiche")} className={primaryActionClass}>
            Mettre à jour une fiche
          </Link>
        ) : (
          <Link href="/dashboard/club" className={navActionClass}>
            Retour
          </Link>
        )
      }
    >
      <Suspense fallback={<div className="h-10" />}>
        <ClubModuleTabs
          ariaLabel="Équipement"
          defaultTab="suivi"
          activeTab={activeTab}
          preserveParams={["groupe"]}
          tabs={[
            { id: "suivi", label: "Suivi", count: rows.length },
            { id: "fiche", label: "Fiche joueur" },
            { id: "inventaire", label: "Inventaire", count: inventory?.length ?? 0 },
            { id: "pret", label: "Prêts", count: loanedCount },
          ]}
        />
      </Suspense>

      {activeTab === "fiche" ? (
        <div className="max-w-xl">
          <InfoBanner title="Fiche équipement">
            <p>
              Mettez à jour le maillot, le short, les chaussettes et la
              pointure pour un joueur.
            </p>
          </InfoBanner>
          <div className="mt-4">
            <PlayerEquipmentForm players={playerOptions} />
          </div>
        </div>
      ) : null}

      {activeTab === "inventaire" ? (
        <div className="max-w-xl">
          <InfoBanner title="Inventaire club">
            <p>Ajoutez du matériel disponible pour les prêts aux joueurs.</p>
          </InfoBanner>
          <div className="mt-4">
            <InventoryForm />
          </div>
        </div>
      ) : null}

      {activeTab === "pret" ? (
        <div className="max-w-xl">
          <InfoBanner title="Prêt matériel">
            <p>Associez un article disponible à un joueur avec une date de retour.</p>
          </InfoBanner>
          <div className="mt-4">
            <LoanEquipmentForm
              players={playerOptions}
              inventory={inventory ?? []}
            />
          </div>
        </div>
      ) : null}

      {activeTab === "suivi" ? (
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
                    <td className="px-4 py-2.5">
                      {EQUIPMENT_STATUS_LABELS[row.jersey_status]}
                    </td>
                    <td className="px-4 py-2.5">
                      {EQUIPMENT_STATUS_LABELS[row.shorts_status]}
                    </td>
                    <td className="px-4 py-2.5">
                      {EQUIPMENT_STATUS_LABELS[row.shin_guards_status]}
                    </td>
                    <td className="px-4 py-2.5">{row.shoe_size ?? "—"}</td>
                  </ClickableTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </ClubSection>
      ) : null}
    </DashboardShell>
  );
}
