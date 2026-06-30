import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { ClubSection } from "@/components/club-ui";
import { WelfareForm, WelfareList } from "./aides-client";
import { canApproveWelfare } from "@/lib/auth";

export default async function AidesPage() {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, matricule")
    .eq("is_archived", false)
    .order("last_name");

  const { data: requests } = await supabase
    .from("welfare_requests")
    .select("*, players(first_name, last_name)")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title="Aides sociales"
      subtitle={CLUB.name}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">Retour</Link>}
    >
      <WelfareForm
        players={
          players?.map((p) => ({
            id: p.id,
            label: `${p.last_name} ${p.first_name} (${p.matricule})`,
          })) ?? []
        }
      />
      <ClubSection title="Demandes">
        <WelfareList requests={requests ?? []} canManage={canApproveWelfare(profile.role)} />
      </ClubSection>
    </DashboardShell>
  );
}
