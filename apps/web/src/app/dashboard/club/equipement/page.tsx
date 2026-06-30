import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { EQUIPMENT_STATUS_LABELS } from "@/lib/club-modules/constants";
import { ClubSection } from "@/components/club-ui";
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
    .select("id, first_name, last_name, matricule, team")
    .eq("is_archived", false)
    .order("last_name");
  if (groupe) playerQuery = playerQuery.eq("team", groupe);

  const { data: players } = await playerQuery;
  const { data: equipment } = await supabase
    .from("player_equipment")
    .select("*, players(first_name, last_name, team, matricule)");
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

  return (
    <DashboardShell
      title="Équipement"
      subtitle={groupe ? `${groupe} — ${CLUB.name}` : CLUB.name}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">Retour</Link>}
    >
      <EquipmentForms
        players={playerOptions}
        inventory={inventory ?? []}
      />

      <ClubSection title="État par joueur">
        <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-green-800 text-green-100">
              <tr>
                <th className="px-4 py-3 text-left">Joueur</th>
                <th className="px-4 py-3 text-left">Maillot</th>
                <th className="px-4 py-3 text-left">Short</th>
                <th className="px-4 py-3 text-left">Protège-tibias</th>
                <th className="px-4 py-3 text-left">Pointure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {(filteredEquipment ?? []).map((row) => {
                const p = unwrapRelation(row.players);
                return (
                  <tr key={row.player_id}>
                    <td className="px-4 py-3">{p ? `${p.last_name} ${p.first_name}` : "—"}</td>
                    <td className="px-4 py-3">{EQUIPMENT_STATUS_LABELS[row.jersey_status]}</td>
                    <td className="px-4 py-3">{EQUIPMENT_STATUS_LABELS[row.shorts_status]}</td>
                    <td className="px-4 py-3">{EQUIPMENT_STATUS_LABELS[row.shin_guards_status]}</td>
                    <td className="px-4 py-3">{row.shoe_size ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ClubSection>
    </DashboardShell>
  );
}
