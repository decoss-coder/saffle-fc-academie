import Link from "next/link";
import { DashboardShell, requireUser, canManagePlayers, canManagePayments, isParentRole } from "@/lib/auth";
import { CLUB } from "@/lib/club";

const STAFF_MODULES = [
  { href: "/dashboard/club/planning", label: "Planning", desc: "Créneaux & heures min." },
  { href: "/dashboard/club/equipement", label: "Équipement", desc: "Maillots, chaussures, prêts" },
  { href: "/dashboard/club/discipline", label: "Discipline", desc: "Absences & encouragements" },
  { href: "/dashboard/club/medical", label: "Médical", desc: "Assurance & certificats" },
  { href: "/dashboard/club/matchs", label: "Matchs & primes", desc: "2 500 / 5 000 FCFA" },
  { href: "/dashboard/club/interessement", label: "Intéressement", desc: "Répartition par groupe" },
  { href: "/dashboard/club/logistique", label: "Logistique", desc: "Tondeuse, gym, terrain" },
  { href: "/dashboard/club/aides", label: "Aides sociales", desc: "Logement & nourriture" },
  { href: "/dashboard/club/transport", label: "Transport", desc: "Demandes déplacements" },
];

export default async function ClubHubPage() {
  const { profile } = await requireUser();
  const isStaff = canManagePlayers(profile.role);
  const isParent = isParentRole(profile.role);
  const isTreasurer = canManagePayments(profile.role);

  const modules = STAFF_MODULES.filter((m) => {
    if (m.href.includes("matchs") || m.href.includes("interessement")) {
      return isTreasurer || isStaff;
    }
    if (m.href.includes("aides") || m.href.includes("transport")) {
      return isStaff || isParent;
    }
    return isStaff;
  });

  return (
    <DashboardShell
      title="Vie du club"
      subtitle={`Modules opérationnels — ${CLUB.name}`}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm transition hover:border-green-400 hover:bg-green-50"
          >
            <h2 className="text-lg font-semibold text-green-900">{mod.label}</h2>
            <p className="mt-1 text-sm text-green-700">{mod.desc}</p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
