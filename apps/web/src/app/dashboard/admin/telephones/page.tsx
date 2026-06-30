import { DashboardShell, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRole } from "@/lib/roles";
import { rowCompact } from "@/lib/dashboard-ui";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { StatusBadge } from "@/components/status-badge";
import { PhoneDisplay } from "@/components/phone-display";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { registerStaffPhone } from "./actions";
import { ImportMembersButton } from "./import-members-button";
import { MemberRowActions } from "./member-row-actions";
import { StaffPhoneForm } from "./staff-phone-form";

export default async function AdminTelephonesPage() {
  const { user, profile } = await requireAdmin();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("phone_registry")
    .select(
      "phone_normalized, role, full_name, position_title, linked_user_id, created_at",
    )
    .order("created_at", { ascending: false });

  const { count: playerCount } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false);

  return (
    <DashboardShell
      title="Membres & accès"
      breadcrumbs={[
        { label: "Administration", href: "/dashboard" },
        { label: "Membres" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <InfoBanner title="Import en masse">
        <p>
          Enregistrez le bureau, les joueurs U12 et U16 en un clic. L&apos;import
          est idempotent : les membres déjà présents ne sont pas dupliqués.
        </p>
        <p className="mt-2 text-slate-600">
          {playerCount ?? 0} joueur(s) actif(s) en base actuellement.
        </p>
        <div className="mt-3">
          <ImportMembersButton />
        </div>
      </InfoBanner>

      <StaffPhoneForm action={registerStaffPhone} />

      <DataTable
        count={
          <ListCount
            count={entries?.length ?? 0}
            label="membre"
            labelPlural="membres"
          />
        }
      >
        <DataTableHead>
          <tr>
            <DataTableTh>Téléphone</DataTableTh>
            <DataTableTh>Nom</DataTableTh>
            <DataTableTh>Poste</DataTableTh>
            <DataTableTh>Statut</DataTableTh>
            <DataTableTh>Actions</DataTableTh>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {!entries?.length ? (
            <tr>
              <td colSpan={5} className="px-4 py-8">
                <EmptyState message="Aucun membre enregistré. Utilisez l'import ou ajoutez un membre ci-dessus." />
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.phone_normalized} className="hover:bg-green-50">
                <td className={rowCompact}>
                  <PhoneDisplay phone={entry.phone_normalized} />
                </td>
                <td className={rowCompact}>{entry.full_name ?? "—"}</td>
                <td className={`${rowCompact} text-green-800`}>
                  {formatRole(entry.role, entry.position_title)}
                </td>
                <td className={rowCompact}>
                  {entry.linked_user_id ? (
                    <StatusBadge label="Compte activé" variant="good" />
                  ) : (
                    <StatusBadge
                      label="En attente d'activation"
                      variant="warn"
                    />
                  )}
                </td>
                <td className={rowCompact}>
                  <MemberRowActions
                    phone={entry.phone_normalized}
                    linkedUserId={entry.linked_user_id}
                  />
                </td>
              </tr>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </DashboardShell>
  );
}
