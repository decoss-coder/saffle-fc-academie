import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRole } from "@/lib/roles";
import { rowCompact, primaryActionClass } from "@/lib/dashboard-ui";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { StatusBadge } from "@/components/status-badge";
import { PhoneDisplay } from "@/components/phone-display";
import { resolveClubTab } from "@/lib/resolve-club-tab";
import { isAgentRole, staffMemberHref } from "@/lib/staff/registry";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { registerStaffPhone } from "./actions";
import { StaffMemberForm } from "./staff-member-form";
import { AgentsTabs } from "./agents-tabs";
import { ImportMembersButton } from "./import-members-button";

const TABS = ["liste", "ajouter", "import"] as const;

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "liste") as (typeof TABS)[number];

  const { user, profile } = await requireAdmin();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("phone_registry")
    .select(
      "phone_normalized, role, full_name, position_title, linked_user_id, created_at",
    )
    .neq("role", "parent")
    .order("created_at", { ascending: false });

  const entries = (rows ?? []).filter((entry) => isAgentRole(entry.role));

  const { count: playerCount } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false);

  const pendingCount =
    entries.filter((e) => !e.linked_user_id).length;

  return (
    <DashboardShell
      title="Agents"
      subtitle="Encadrement et employés hors comité directeur. Les membres du comité sont gérés dans Comité directeur."
      breadcrumbs={[
        { label: "Administration", href: "/dashboard" },
        { label: "Agents" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        activeTab === "liste" ? (
          <Link
            href="/dashboard/admin/agents?tab=ajouter"
            className={primaryActionClass}
          >
            Ajouter un agent
          </Link>
        ) : undefined
      }
    >
      <Suspense fallback={<div className="h-10" />}>
        <AgentsTabs
          activeTab={activeTab}
          agentsCount={entries.length}
          pendingCount={pendingCount}
        />
      </Suspense>

      {activeTab === "import" ? (
        <InfoBanner title="Import en masse">
          <p>
            Enregistrez le bureau, les joueurs U12 et U16 en un clic. L&apos;import
            est idempotent : les entrées déjà présentes ne sont pas dupliquées.
          </p>
          <p className="mt-2 text-slate-600">
            {playerCount ?? 0} joueur(s) actif(s) en base actuellement.
            {pendingCount > 0
              ? ` · ${pendingCount} agent(s) en attente d'activation.`
              : ""}
          </p>
          <div className="mt-3">
            <ImportMembersButton />
          </div>
        </InfoBanner>
      ) : null}

      {activeTab === "ajouter" ? (
        <div className="max-w-2xl space-y-4">
          <InfoBanner title="Enregistrer un agent">
            <p>
              La personne activera son compte avec son numéro de téléphone via
              la page /activer. Les membres du comité directeur sont enregistrés
              via l&apos;import ou le module Comité directeur.
            </p>
          </InfoBanner>
          <StaffMemberForm mode="create" action={registerStaffPhone} />
        </div>
      ) : null}

      {activeTab === "liste" ? (
        <DataTable
          count={
            <ListCount
              count={entries.length}
              label="agent"
              labelPlural="agents"
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
            {!entries.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8">
                  <EmptyState message="Aucun agent enregistré.">
                    <Link
                      href="/dashboard/admin/agents?tab=import"
                      className={primaryActionClass}
                    >
                      Importer les membres
                    </Link>
                  </EmptyState>
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.phone_normalized} className="hover:bg-green-50">
                  <td className={rowCompact}>
                    <PhoneDisplay phone={entry.phone_normalized} />
                  </td>
                  <td className={rowCompact}>
                    <Link
                      href={staffMemberHref(entry.phone_normalized)}
                      className="font-medium text-green-900 underline hover:text-green-950"
                    >
                      {entry.full_name ?? "—"}
                    </Link>
                  </td>
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
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={staffMemberHref(entry.phone_normalized)}
                        className="rounded-full border border-green-300 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
                      >
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </DataTableBody>
        </DataTable>
      ) : null}
    </DashboardShell>
  );
}
