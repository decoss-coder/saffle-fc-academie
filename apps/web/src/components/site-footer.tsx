import Image from "next/image";
import Link from "next/link";
import { CLUB } from "@/lib/club";

export function SiteFooter() {
  return (
    <footer className="border-t border-emerald-900/30 bg-zinc-950 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Image
            src={CLUB.assets.logo}
            alt={CLUB.name}
            width={64}
            height={64}
            className="rounded-full ring-2 ring-emerald-500/20"
          />
          <div>
            <p className="text-lg font-semibold">{CLUB.name}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {CLUB.tagline}
            </p>
            <p className="text-sm text-zinc-500">{CLUB.location}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm">
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
      <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {CLUB.name}. Tous droits réservés.
      </p>
    </footer>
  );
}
