import Link from "next/link";

const modules = [
  "Administration",
  "Joueurs",
  "Parents",
  "Coach",
  "Paiements",
  "Communication",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              SAFFLE FC
            </p>
            <h1 className="text-2xl font-semibold">Académie</h1>
            <p className="mt-1 text-sm text-zinc-400">Sinfra, Côte d&apos;Ivoire</p>
          </div>
          <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="rounded-full border border-zinc-700 px-5 py-2 text-sm transition hover:border-zinc-500"
          >
            Inscription
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
          >
            Connexion
          </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-16">
        <section className="max-w-3xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
            Sinfra, Côte d&apos;Ivoire
          </p>
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
            La plateforme officielle du club SAFFLE FC Académie.
          </h2>
          <p className="text-lg leading-8 text-zinc-400">
            Administration, suivi sportif, paiements en FCFA (Wave), convocations
            et communication — pour dirigeants, coaches, parents et joueurs du
            club.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
            >
              <h3 className="text-lg font-medium">{module}</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Module prévu dans le cahier des charges fonctionnel.
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-emerald-500/10 to-zinc-900 p-8">
          <h3 className="text-xl font-medium">Le club</h3>
          <p className="mt-3 max-w-2xl text-zinc-400">
            SAFFLE FC Académie est un club de football basé à Sinfra, en Côte
            d&apos;Ivoire. Cette plateforme est son outil de gestion
            numérique — web, iOS et Android — avec Supabase et déploiement sur
            Vercel.
          </p>
        </section>
      </main>
    </div>
  );
}
