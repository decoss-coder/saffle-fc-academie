import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { ClubSection } from "@/components/club-ui";
import { TransportForm, TransportList } from "./transport-client";

export default async function TransportPage() {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, matricule")
    .eq("is_archived", false)
    .order("last_name");

  const { data: requests } = await supabase
    .from("transport_requests")
    .select("*, players(first_name, last_name)")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title="Transport"
      subtitle={CLUB.name}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">Retour</Link>}
    >
      <TransportForm
        players={
          players?.map((p) => ({
            id: p.id,
            label: `${p.last_name} ${p.first_name} (${p.matricule})`,
          })) ?? []
        }
      />
      <ClubSection title="Demandes">
        <TransportList requests={requests ?? []} />
      </ClubSection>
    </DashboardShell>
  );
}
