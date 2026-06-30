import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DashboardShell,
  requireUser,
  canManagePlayers,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatCategory,
  formatDate,
  formatGender,
} from "@/lib/players/constants";
import { PlayerDocumentsList } from "@/components/player-documents-list";
import { archivePlayer } from "@/app/dashboard/joueurs/actions";

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default async function JoueurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!player) {
    notFound();
  }

  const canManage = canManagePlayers(profile.role);

  const { data: documents } = await supabase
    .from("player_documents")
    .select(
      "id, player_id, document_type, file_name, file_path, file_size, status, admin_note, created_at, reviewed_at",
    )
    .eq("player_id", id)
    .order("created_at", { ascending: false });

  const sections = [
    {
      title: "Identité",
      fields: [
        ["Matricule", player.matricule],
        ["Nom complet", `${player.last_name} ${player.first_name}`],
        ["Nom de naissance", display(player.birth_name)],
        ["Date de naissance", formatDate(player.birth_date)],
        ["Sexe", formatGender(player.gender)],
      ],
    },
    {
      title: "Nationalité et naissance",
      fields: [
        ["Nationalité principale", display(player.nationality)],
        ["2e nationalité", display(player.secondary_nationality)],
        ["Pays de naissance", display(player.birth_country)],
        ["Région / État de naissance", display(player.birth_region)],
        ["Ville de naissance", display(player.birth_city)],
      ],
    },
    {
      title: "Effectif club",
      fields: [
        ["Catégorie", formatCategory(player.category)],
        ["Équipe", display(player.team)],
      ],
    },
    {
      title: "Famille et contact",
      fields: [
        ["Père", display(player.father_name)],
        ["Mère", display(player.mother_name)],
        ["Tuteur", display(player.guardian_name)],
        ["Téléphone", display(player.phone)],
        ["Adresse", display(player.address)],
      ],
    },
    {
      title: "Profil sportif",
      fields: [
        ["Taille", player.height_cm ? `${player.height_cm} cm` : "—"],
        ["Poids", player.weight_kg ? `${player.weight_kg} kg` : "—"],
        ["Pied fort", display(player.strong_foot)],
        ["Poste principal", display(player.primary_position)],
        ["Poste secondaire", display(player.secondary_position)],
      ],
    },
    {
      title: "Documents fédération",
      fields: [
        ["Certificat de naissance", display(player.birth_certificate_ref)],
        ["Ancien n° Licence Plus", display(player.former_license_number)],
      ],
    },
  ] as const;

  return (
    <DashboardShell
      title={`${player.last_name} ${player.first_name}`}
      subtitle={player.matricule}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        <div className="flex flex-wrap gap-2">
          {canManage && !player.is_archived && (
            <Link
              href={`/dashboard/joueurs/${player.id}/modifier`}
              className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Modifier
            </Link>
          )}
          <Link
            href="/dashboard/joueurs"
            className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800 transition hover:bg-green-50"
          >
            Retour à la liste
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">
              {section.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm text-green-700">{label}</p>
                  <p className="mt-1 font-medium text-green-900">{value}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="pt-2">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">
          Documents déposés
        </h2>
        <PlayerDocumentsList
          documents={documents ?? []}
          canReview={canManage}
        />
      </section>

      {canManage && !player.is_archived && (
        <form action={archivePlayer} className="pt-6">
          <input type="hidden" name="player_id" value={player.id} />
          <button
            type="submit"
            className="rounded-full border border-red-300 px-5 py-2 text-sm text-red-700 transition hover:bg-red-50"
          >
            Archiver ce joueur
          </button>
        </form>
      )}
    </DashboardShell>
  );
}
