import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
import { MedicalForm } from "./medical-client";

export default async function MedicalPage() {
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
        <Link
          href="/dashboard/club"
          className={navActionClass}
        >
          Retour
        </Link>
      }
    >
      {expiring.length > 0 && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {expiring.length} certificat(s) expiré(s) ou expirant sous 30 jours.
        </p>
      )}

      <MedicalForm
        players={
          playerList.map((p) => ({
            id: p.id,
            label: `${p.last_name} ${p.first_name} (${p.matricule})`,
          }))
        }
      />

      <ClubSection title="Effectif">
        <DataTable
          count={
            <ListCount count={playerList.length} label="joueur" labelPlural="joueurs" />
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
              <ClickableTableRow
                key={p.id}
                href={`/dashboard/joueurs/${p.id}`}
              >
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
                <td className={rowCompact}>{p.insurance_provider ?? "Aucune"}</td>
                <td className={`${rowCompact} text-slate-600`}>
                  {p.medical_cert_expires_at
                    ? new Intl.DateTimeFormat("fr-CI").format(
                        new Date(p.medical_cert_expires_at),
                      )
                    : "Aucune"}
                </td>
                <td className={rowCompact}>{p.team_doctor_contact ?? "—"}</td>
              </ClickableTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </ClubSection>
    </DashboardShell>
  );
}
