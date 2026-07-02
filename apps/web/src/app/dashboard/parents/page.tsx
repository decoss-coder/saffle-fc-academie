import Link from "next/link";
import { Suspense } from "react";
import { canManagePhones, DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRole } from "@/lib/roles";
import { rowCompact } from "@/lib/dashboard-ui";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { StatusBadge } from "@/components/status-badge";
import { PhoneDisplay } from "@/components/phone-display";
import { resolveClubTab } from "@/lib/resolve-club-tab";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import {
  canManageParentEntry,
  fetchParentDirectory,
  parentDetailHref,
} from "@/lib/parents/directory";
import { ParentListTabs } from "./parent-list-tabs";

const TABS = ["tous", "actifs", "en-attente"] as const;

export default async function AdminParentsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.statut, [...TABS], "tous") as
    | (typeof TABS)[number];

  const { user, profile } = await requireStaff();
  const supabase = await createClient();
  const allParents = await fetchParentDirectory(supabase);
  const canManage = canManagePhones(profile.role, profile.isSuperAdmin);

  const activeCount = allParents.filter((p) => p.activated).length;
  const pendingCount = allParents.filter((p) => !p.activated).length;

  const query = params.q?.trim().toLowerCase() ?? "";
  let parents = allParents;

  if (activeTab === "actifs") {
    parents = parents.filter((p) => p.activated);
  } else if (activeTab === "en-attente") {
    parents = parents.filter((p) => !p.activated);
  }

  if (query) {
    parents = parents.filter(
      (p) =>
        p.displayName.toLowerCase().includes(query) ||
        p.phone.toLowerCase().includes(query),
    );
  }

  return (
    <DashboardShell
      title="Parents"
      subtitle="Consultez la liste des parents, leurs enfants liés et l'état de leur compte."
      breadcrumbs={[
        { label: "Club", href: "/dashboard/joueurs" },
        { label: "Parents" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <InfoBanner title="Annuaire famille">
        Chaque ligne regroupe un parent par numéro de téléphone. Ouvrez la fiche
        pour voir les enfants, cotisations, convocations et documents.
      </InfoBanner>

      <Suspense fallback={<div className="h-10" />}>
        <ParentListTabs
          activeTab={activeTab}
          totalCount={allParents.length}
          activeCount={activeCount}
          pendingCount={pendingCount}
        />
      </Suspense>

      <DataTable
        count={
          <ListCount
            count={parents.length}
            label="parent"
            labelPlural="parents"
          />
        }
      >
        <DataTableHead>
          <tr>
            <DataTableTh>Nom</DataTableTh>
            <DataTableTh>Téléphone</DataTableTh>
            <DataTableTh>Enfants</DataTableTh>
            <DataTableTh>À suivre</DataTableTh>
            <DataTableTh>Statut</DataTableTh>
            <DataTableTh>Actions</DataTableTh>
          </tr>
        </DataTableHead>
        <DataTableBody>
          {!parents.length ? (
            <tr>
              <td colSpan={6} className="px-4 py-8">
                <EmptyState message="Aucun parent trouvé pour ce filtre." />
              </td>
            </tr>
          ) : (
            parents.map((parent) => (
              <tr key={parent.key} className="hover:bg-green-50">
                <td className={rowCompact}>
                  <div>
                    <Link
                      href={parentDetailHref(parent.key)}
                      className="font-medium text-green-950 hover:text-green-800 hover:underline"
                    >
                      {parent.displayName}
                    </Link>
                    {parent.isStaffGuardian && parent.accountRole ? (
                      <p className="mt-0.5 text-xs text-amber-800">
                        {formatRole(parent.accountRole)} · aussi parent
                      </p>
                    ) : null}
                  </div>
                </td>
                <td className={rowCompact}>
                  {parent.phone.startsWith("staff-") ? (
                    "—"
                  ) : (
                    <PhoneDisplay phone={parent.phone} />
                  )}
                </td>
                <td className={rowCompact}>{parent.childrenCount}</td>
                <td className={rowCompact}>
                  <div className="flex flex-wrap gap-1">
                    {parent.openDuesCount > 0 ? (
                      <StatusBadge
                        label={`${parent.openDuesCount} cotisation${parent.openDuesCount > 1 ? "s" : ""}`}
                        variant="warn"
                      />
                    ) : null}
                    {parent.pendingConvocationsCount > 0 ? (
                      <StatusBadge
                        label={`${parent.pendingConvocationsCount} convoc.`}
                        variant="warn"
                      />
                    ) : null}
                    {!parent.openDuesCount &&
                    !parent.pendingConvocationsCount ? (
                      <span className="text-green-700">—</span>
                    ) : null}
                  </div>
                </td>
                <td className={rowCompact}>
                  {parent.activated ? (
                    <StatusBadge label="Compte activé" variant="good" />
                  ) : (
                    <StatusBadge
                      label="En attente d'activation"
                      variant="warn"
                    />
                  )}
                </td>
                <td className={rowCompact}>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link
                      href={parentDetailHref(parent.key)}
                      className="font-medium text-green-800 underline hover:text-green-900"
                    >
                      Voir la fiche
                    </Link>
                    {canManage && canManageParentEntry(parent) ? (
                      <Link
                        href={`${parentDetailHref(parent.key)}?tab=fiche`}
                        className="font-medium text-green-800 underline hover:text-green-900"
                      >
                        Modifier
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </DataTableBody>
      </DataTable>
    </DashboardShell>
  );
}
