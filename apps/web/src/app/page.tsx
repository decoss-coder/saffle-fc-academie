import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { CLUB } from "@/lib/club";

const categories = [
  { name: "U12", image: CLUB.assets.u12Jeunes },
  { name: "U16", image: CLUB.assets.u16Jeunes },
  { name: "Équipe A", image: CLUB.assets.equipeA },
];

const news = [
  {
    title: "Formation jeunes",
    date: "Académie",
    image: CLUB.assets.formation,
  },
  {
    title: "Vie du groupe",
    date: "Sinfra",
    image: CLUB.assets.fanion,
  },
  {
    title: "Préparation collective",
    date: "Terrain",
    image: CLUB.assets.equipeB,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[#f5f7f2] text-slate-950">
      <section className="relative min-h-[86svh] overflow-hidden bg-[#071c16] pb-8 text-white">
        <div className="absolute inset-0">
          <Image
            src={CLUB.assets.formation}
            alt={`${CLUB.name} sur le terrain`}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(7,28,22,0.96)_0%,rgba(7,28,22,0.82)_42%,rgba(7,28,22,0.34)_78%,rgba(7,28,22,0.18)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#f5f7f2] via-[#f5f7f2]/10 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[86svh] w-full max-w-7xl flex-col px-5 pt-24 sm:px-8 sm:pt-28">
          <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#071c16]/78 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <Image
                  src={CLUB.assets.logo}
                  alt={CLUB.name}
                  width={48}
                  height={48}
                  className="rounded-2xl bg-white object-cover p-1 shadow-lg shadow-black/20 ring-1 ring-white/20"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight">
                    {CLUB.shortName}
                  </p>
                  <p className="text-xs text-emerald-50/65">{CLUB.location}</p>
                </div>
              </Link>
              <nav className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/8 p-1 backdrop-blur md:flex">
                <Link
                  href="#equipes"
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white"
                >
                  Équipes
                </Link>
                <Link
                  href="#actualites"
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10 hover:text-white"
                >
                  Actualités
                </Link>
              </nav>
            </div>
          </header>

          <div className="flex flex-1 items-center py-8 lg:py-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-100/70">
                Centre de formation de football
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                {CLUB.name}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-emerald-50/78 sm:text-lg">
                À {CLUB.city}, l&apos;académie organise le terrain, les familles et
                l&apos;administration dans une même plateforme : joueurs, convocations,
                documents et paiements Wave.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/activer"
                  className="rounded-full bg-[#d7f46a] px-6 py-3 text-sm font-semibold text-[#071c16] shadow-lg shadow-black/20 transition hover:bg-[#e6ff86]"
                >
                  Activer mon compte
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>

          <div className="relative z-20 grid gap-3 pb-2 sm:grid-cols-3">
            {[
              ["Sinfra", "base de l'académie"],
              ["U12 - U16", "formation jeunes"],
              ["Wave FCFA", "paiements suivis"],
            ].map(([value, label]) => (
              <div
                key={value}
                className="rounded-2xl border border-white/18 bg-[#071c16]/58 px-5 py-4 shadow-xl shadow-black/15 backdrop-blur-md"
              >
                <p className="text-lg font-semibold">{value}</p>
                <p className="mt-1 text-sm text-emerald-50/80">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pb-16 pt-14">
        <section id="equipes" className="space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-green-900">Nos équipes</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {categories.map((category) => (
              <article
                key={category.name}
                className="group overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={category.image}
                    alt={`${category.name} — ${CLUB.name}`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-950/82 via-green-950/10 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-xl font-semibold text-white">
                    {category.name}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="actualites" className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700/70">
                Actualités
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-green-900">
                Vie de l&apos;académie
              </h2>
            </div>
            <a
              href={CLUB.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-fit rounded-full border border-green-300 px-5 py-2.5 text-sm font-semibold text-green-900 transition hover:bg-green-50"
            >
              Voir Facebook
            </a>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {news.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[16/11]">
                  <Image
                    src={item.image}
                    alt={`${item.title} — ${CLUB.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700/70">
                    {item.date}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-green-950">
                    {item.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
