import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRole } from "@/lib/roles";
import { navActionClass } from "@/lib/dashboard-ui";
import { InfoBanner } from "@/components/info-banner";
import { StatusBadge } from "@/components/status-badge";
import { isCommitteeMemberRole } from "@/lib/staff/registry";
import { updateMember } from "../actions";
import { StaffMemberForm } from "../staff-member-form";
import { MemberSecondaryActions } from "../member-secondary-actions";

export default async function StaffMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { phone: phoneParam } = await params;
  const { from } = await searchParams;
  const phoneNormalized = decodeURIComponent(phoneParam);

  const { user, profile } = await requireAdmin();
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("phone_registry")
    .select(
      "phone_normalized, role, full_name, position_title, linked_user_id, created_at",
    )
    .eq("phone_normalized", phoneNormalized)
    .neq("role", "parent")
    .maybeSingle();

  if (!entry) notFound();

  const isCommittee = isCommitteeMemberRole(entry.role);
  const backHref =
    from === "comite"
      ? "/dashboard/comite?tab=membres"
      : "/dashboard/admin/agents";

  const redirectAfterDelete =
    from === "comite"
      ? "/dashboard/comite?tab=membres"
      : "/dashboard/admin/agents";

  return (
    <DashboardShell
      title={entry.full_name ?? "Fiche agent"}
      subtitle={formatRole(entry.role, entry.position_title)}
      breadcrumbs={[
        { label: "Administration", href: "/dashboard" },
        {
          label: isCommittee ? "Comité directeur" : "Agents",
          href: isCommittee ? "/dashboard/comite?tab=membres" : "/dashboard/admin/agents",
        },
        { label: entry.full_name ?? "Fiche" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link href={backHref} className={navActionClass}>
          ← Retour
        </Link>
      }
    >
      <div className="space-y-6">
        {isCommittee ? (
          <InfoBanner title="Membre du comité directeur">
            Cette personne figure dans le comité directeur. Les cotisations
            comité sont gérées dans{" "}
            <Link href="/dashboard/comite" className="font-medium underline">
              Comité directeur
            </Link>
            .
          </InfoBanner>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {entry.linked_user_id ? (
            <StatusBadge label="Compte activé" variant="good" />
          ) : (
            <StatusBadge label="En attente d'activation" variant="warn" />
          )}
        </div>

        <StaffMemberForm
          mode="edit"
          action={updateMember}
          defaultValues={{
            phone_normalized: entry.phone_normalized,
            full_name: entry.full_name,
            position_title: entry.position_title,
            role: entry.role,
          }}
          from={from === "comite" ? "comite" : "agents"}
        />

        <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Actions
          </h3>
          <div className="mt-4">
            <MemberSecondaryActions
              phone={entry.phone_normalized}
              linkedUserId={entry.linked_user_id}
              redirectAfterDelete={redirectAfterDelete}
            />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
