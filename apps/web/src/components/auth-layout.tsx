import { ClubLogo } from "@/components/club-logo";
import { CLUB } from "@/lib/club";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-full bg-[#07130d] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07130d]/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <ClubLogo size="sm" href="/" light />
          <a
            href="/"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-[#d8b451] hover:text-white"
          >
            Accueil
          </a>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(7,19,13,0.96), rgba(7,19,13,0.7), rgba(7,19,13,0.98)), url(${CLUB.assets.u16Jeunes})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(216,180,81,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1fr_460px] lg:items-center lg:py-16">
          <section className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-[#d8b451]">
              {CLUB.location} · Accès officiel
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Entrer dans la plateforme du club.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
              Un accès réservé aux familles, au staff et à l'administration pour
              suivre les joueurs, les convocations et les paiements Wave.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {["Parents", "Staff", "Administration"].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/12 bg-white/[0.06] px-4 py-4 shadow-2xl shadow-black/20 backdrop-blur-md"
                >
                  <p className="text-sm font-bold text-white">{item}</p>
                  <p className="mt-1 text-xs text-white/55">Accès vérifié</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#d8b451]/35 bg-[#f8faf6] p-6 text-[#06110b] shadow-2xl shadow-black/40 sm:p-8">
            <p className="text-sm font-black uppercase text-[#b99331]">
              {subtitle}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#06110b]">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#3f4b43]">
              {CLUB.name} · {CLUB.tagline}
            </p>
            <div className="mt-7">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}
