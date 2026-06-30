import Link from "next/link";
import { DashboardShell, requireUser, canManagePhones } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false);

  const modules = [
    {
      title: "Joueurs",
      href: "/dashboard/joueurs",
      status: `${count ?? 0} joueur(s) actif(s)`,
    },
    ...(canManagePhones(profile.role)
      ? [
          {
            title: "Accès téléphone",
            href: "/dashboard/admin/telephones",
            status: "Parents et staff autorisés",
          },
        ]
      : []),
    { title: "Convocations", href: "#", status: "À venir" },
    { title: "Paiements", href: "#", status: "À venir (Wave / FCFA)" },
  ];

  return (
    <DashboardShell
      title={`Bonjour ${profile.full_name || "!"}`}
      subtitle={`Tableau de bord — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm transition hover:border-green-400 hover:bg-green-50"
          >
            <h2 className="text-lg font-medium text-green-900">{item.title}</h2>
            <p className="mt-2 text-sm text-green-700">{item.status}</p>
          </Link>
        ))}
      </section>
    </DashboardShell>
  );
}
