import Image from "next/image";
import Link from "next/link";
import { CLUB } from "@/lib/club";

export function SiteFooter() {
  return (
    <footer className="bg-green-800 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Image
            src={CLUB.assets.logo}
            alt={CLUB.name}
            width={64}
            height={64}
            className="rounded-full bg-white ring-2 ring-white/30"
          />
          <div>
            <p className="text-lg font-semibold">{CLUB.name}</p>
            <p className="mt-1 text-sm text-green-100">{CLUB.tagline}</p>
            <p className="text-sm text-green-200">{CLUB.location}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <a
            href={CLUB.phoneHref}
            className="text-green-100 transition hover:text-white"
          >
            {CLUB.phone}
          </a>
          <a
            href={CLUB.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-100 transition hover:text-white"
          >
            Facebook
          </a>
          <Link href="/login" className="text-white underline hover:no-underline">
            Connexion
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-green-200">
        © {new Date().getFullYear()} {CLUB.name}. Tous droits réservés.
      </p>
    </footer>
  );
}
