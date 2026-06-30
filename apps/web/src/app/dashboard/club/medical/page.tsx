import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { ClubSection } from "@/components/club-ui";
import { MedicalForm } from "./medical-client";

export default async function MedicalPage() {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, matricule, team, insurance_provider, medical_cert_expires_at, team_doctor_contact")
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

  return (
    <DashboardShell
      title="Suivi médical"
      subtitle={CLUB.name}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">Retour</Link>}
    >
      {expiring.length > 0 && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {expiring.length} certificat(s) expiré(s) ou expirant sous 30 jours.
        </p>
      )}

      <MedicalForm
        players={
          players?.map((p) => ({
            id: p.id,
            label: `${p.last_name} ${p.first_name} (${p.matricule})`,
          })) ?? []
        }
      />

      <ClubSection title="Effectif">
        <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-green-800 text-green-100">
              <tr>
                <th className="px-4 py-3 text-left">Joueur</th>
                <th className="px-4 py-3 text-left">Assurance</th>
                <th className="px-4 py-3 text-left">Certificat expire</th>
                <th className="px-4 py-3 text-left">Médecin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {(players ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.last_name} {p.first_name}</td>
                  <td className="px-4 py-3">{p.insurance_provider ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.medical_cert_expires_at
                      ? new Intl.DateTimeFormat("fr-CI").format(new Date(p.medical_cert_expires_at))
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{p.team_doctor_contact ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClubSection>
    </DashboardShell>
  );
}
