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
    <div className="flex flex-1 flex-col bg-white">
      <ClubHeader />

      {/* Hero */}
      <section className="relative min-h-[420px] overflow-hidden border-b border-green-200 sm:min-h-[480px]">
        <div className="absolute inset-0">
          <Image
            src={CLUB.assets.fanion}
            alt={`${CLUB.name} — photo d'équipe avec fanion`}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/55 to-white/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col justify-center px-6 py-20 sm:py-28">
          <div className="max-w-xl space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-green-700">
              {CLUB.tagline}
            </p>
            <h1 className="text-4xl font-bold leading-tight text-green-900 sm:text-5xl lg:text-6xl">
              {CLUB.name}
            </h1>
            <p className="text-lg leading-8 text-green-800">
              Plateforme officielle du centre de formation à {CLUB.city}. Gestion
              des joueurs, convocations, paiements Wave en FCFA et communication
              avec les familles.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-green-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700"
              >
                Rejoindre la plateforme
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-green-700 px-6 py-3 text-sm font-medium text-green-800 transition hover:bg-green-50"
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
            <h2 className="text-3xl font-semibold text-green-900">Nos équipes</h2>
            <p className="mt-2 text-green-700">
              {CLUB.name} — Sinfra, {CLUB.country}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {TEAMS.map((team) => (
              <article
                key={team.name}
                className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={team.image}
                    alt={`${team.name} — ${CLUB.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/75 via-transparent to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-semibold text-white">
                    {team.name}
                  </h3>
                </div>
                <p className="p-4 text-sm text-green-800">{team.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Modules */}
        <section className="space-y-8">
          <h2 className="text-3xl font-semibold text-green-900">
            Modules de la plateforme
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module}
                className="rounded-2xl border border-green-200 bg-green-50 p-6 transition hover:border-green-400 hover:bg-white"
              >
                <h3 className="text-lg font-medium text-green-900">{module}</h3>
                <p className="mt-2 text-sm text-green-700">{CLUB.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-green-200 bg-green-800 p-8 text-white">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="mt-3 max-w-2xl text-green-100">
            {CLUB.name} — {CLUB.tagline}, {CLUB.location}.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <a
              href={CLUB.phoneHref}
              className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 transition hover:bg-white/20"
            >
              {CLUB.phone}
            </a>
            <a
              href={CLUB.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/40 px-5 py-2.5 transition hover:bg-white/10"
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
