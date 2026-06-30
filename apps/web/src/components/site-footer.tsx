import Link from "next/link";
import { CLUB } from "@/lib/club";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{CLUB.name}</p>
          <p className="text-sm text-zinc-400">
            {CLUB.tagline} · {CLUB.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <a
            href={CLUB.phoneHref}
            className="text-zinc-400 transition hover:text-emerald-400"
          >
            {CLUB.phone}
          </a>
          <a
            href={CLUB.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 transition hover:text-emerald-400"
          >
            Facebook
          </a>
          <Link href="/login" className="text-emerald-400 hover:underline">
            Connexion
          </Link>
        </div>
      </div>
    </footer>
  );
}
