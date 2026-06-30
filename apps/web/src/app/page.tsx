import Image from "next/image";
import Link from "next/link";
import { ClubHeader } from "@/components/club-header";
import { SiteFooter } from "@/components/site-footer";
import { CLUB, TEAMS } from "@/lib/club";

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
      <ClubHeader />

      {/* Hero */}
      <section className="relative min-h-[420px] overflow-hidden border-b border-emerald-900/30 sm:min-h-[480px]">
        <div className="absolute inset-0">
          <Image
            src={CLUB.assets.fanion}
            alt={`${CLUB.name} — photo d'équipe avec fanion`}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/55 to-zinc-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col justify-center px-6 py-20 sm:py-28">
          <div className="max-w-xl space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
              {CLUB.tagline}
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {CLUB.name}
            </h1>
            <p className="text-lg leading-8 text-zinc-300">
              Plateforme officielle du centre de formation à {CLUB.city}. Gestion
              des joueurs, convocations, paiements Wave en FCFA et communication
              avec les familles.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Rejoindre la plateforme
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-zinc-600 px-6 py-3 text-sm transition hover:border-emerald-500"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16">
        {/* Équipes */}
        <section className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold">Nos équipes</h2>
            <p className="mt-2 text-zinc-400">
              {CLUB.name} — Sinfra, {CLUB.country}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {TEAMS.map((team) => (
              <article
                key={team.name}
                className="overflow-hidden rounded-2xl border border-emerald-900/30 bg-zinc-900/50"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={team.image}
                    alt={`${team.name} — ${CLUB.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-semibold">
                    {team.name}
                  </h3>
                </div>
                <p className="p-4 text-sm text-zinc-400">{team.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Modules */}
        <section className="space-y-8">
          <h2 className="text-3xl font-semibold">Modules de la plateforme</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-emerald-800/50"
              >
                <h3 className="text-lg font-medium">{module}</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {CLUB.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/40 to-zinc-900 p-8">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="mt-3 max-w-2xl text-zinc-400">
            {CLUB.name} — {CLUB.tagline}, {CLUB.location}.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <a
              href={CLUB.phoneHref}
              className="rounded-full border border-emerald-700/50 bg-emerald-950/30 px-5 py-2.5 transition hover:border-emerald-500"
            >
              {CLUB.phone}
            </a>
            <a
              href={CLUB.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-emerald-700/50 px-5 py-2.5 transition hover:border-emerald-500"
            >
              Page Facebook
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
