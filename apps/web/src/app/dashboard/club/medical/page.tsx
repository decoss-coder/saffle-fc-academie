import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClubSection } from "@/components/club-ui";
import { ClubModuleTabs } from "@/components/club-module-tabs";
import { resolveClubTab } from "@/lib/resolve-club-tab";
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
import { MedicalForm } from "./medical-client";

const TABS = ["suivi", "enregistrer"] as const;

export default async function MedicalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "suivi");

  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select(
      "id, first_name, last_name, matricule, team, photo_url, insurance_provider, medical_cert_expires_at, team_doctor_contact",
    )
    .eq("is_archived", false)
    .order("last_name");

  const today = new Date();
  const expiring =
    players?.filter((p) => {
      if (!p.medical_cert_expires_at) return false;
      const exp = new Date(p.medical_cert_expires_at);
      const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }) ?? [];

  const playerList = players ?? [];

  return (
    <DashboardShell
      title="Suivi médical"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club", href: "/dashboard/club" },
        { label: "Médical" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        activeTab === "suivi" ? (
          <Link
            href="/dashboard/club/medical?tab=enregistrer"
            className={primaryActionClass}
          >
            Mettre à jour
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
          ariaLabel="Médical"
          defaultTab="suivi"
          activeTab={activeTab}
          tabs={[
            { id: "suivi", label: "Suivi", count: playerList.length },
            { id: "enregistrer", label: "Enregistrer" },
          ]}
        />
      </Suspense>

      {activeTab === "suivi" && expiring.length > 0 ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {expiring.length} certificat(s) expiré(s) ou expirant sous 30 jours.
        </p>
      ) : null}

      {activeTab === "enregistrer" ? (
        <div className="max-w-2xl space-y-4">
          <InfoBanner title="Assurance & certificat">
            <p>
              Enregistrez l&apos;assurance, la date d&apos;expiration du
              certificat médical et le contact du médecin du club.
            </p>
          </InfoBanner>
          <MedicalForm
            players={playerList.map((p) => ({
              id: p.id,
              label: `${p.last_name} ${p.first_name} (${p.matricule})`,
            }))}
          />
        </div>
      ) : null}

      {activeTab === "suivi" ? (
        <ClubSection title="Effectif">
          <DataTable
            count={
              <ListCount
                count={playerList.length}
                label="joueur"
                labelPlural="joueurs"
              />
            }
          >
            <DataTableHead>
              <tr>
                <DataTableTh>Joueur</DataTableTh>
                <DataTableTh>Assurance</DataTableTh>
                <DataTableTh>Certificat expire</DataTableTh>
                <DataTableTh>Médecin</DataTableTh>
                <DataTableTh className="w-10" />
              </tr>
            </DataTableHead>
            <DataTableBody>
              {playerList.map((p) => (
                <ClickableTableRow key={p.id} href={`/dashboard/joueurs/${p.id}`}>
                  <PlayerCellLink href={`/dashboard/joueurs/${p.id}`}>
                    <div className="flex items-center gap-3">
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
                    </div>
                  </PlayerCellLink>
                  <td className="px-4 py-2.5">{p.insurance_provider ?? "Aucune"}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {p.medical_cert_expires_at
                      ? new Intl.DateTimeFormat("fr-CI").format(
                          new Date(p.medical_cert_expires_at),
                        )
                      : "Aucune"}
                  </td>
                  <td className="px-4 py-2.5">{p.team_doctor_contact ?? "—"}</td>
                </ClickableTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </ClubSection>
      ) : null}
    </DashboardShell>
  );
}
