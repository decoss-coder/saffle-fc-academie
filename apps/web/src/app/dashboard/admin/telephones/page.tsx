import { DashboardShell, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { formatPhoneDisplay } from "@/lib/phone";
import { registerStaffPhone } from "./actions";
import { StaffPhoneForm } from "./staff-phone-form";

export default async function AdminTelephonesPage() {
  const { user, profile } = await requireAdmin();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("phone_registry")
    .select("phone_normalized, role, full_name, linked_user_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title="Numéros autorisés"
      subtitle={`Gestion des accès — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <StaffPhoneForm action={registerStaffPhone} />

      <section className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-green-100 text-sm">
          <thead className="bg-green-800 text-left text-green-100">
            <tr>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-100">
            {!entries?.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-green-700">
                  Aucun numéro enregistré. Les parents sont ajoutés automatiquement
                  via la fiche joueur.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.phone_normalized} className="hover:bg-green-50">
                  <td className="px-4 py-3 font-mono text-green-800">
                    {formatPhoneDisplay(entry.phone_normalized)}
                  </td>
                  <td className="px-4 py-3">{entry.full_name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{entry.role}</td>
                  <td className="px-4 py-3">
                    {entry.linked_user_id ? (
                      <span className="text-green-700">Compte activé</span>
                    ) : (
                      <span className="text-amber-700">En attente d&apos;activation</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </DashboardShell>
  );
}
