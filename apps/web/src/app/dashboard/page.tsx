import Link from "next/link";
import { DashboardShell, requireUser } from "@/lib/auth";
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
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-700"
          >
            <h2 className="text-lg font-medium">{item.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{item.status}</p>
          </Link>
        ))}
      </section>
    </DashboardShell>
  );
}
