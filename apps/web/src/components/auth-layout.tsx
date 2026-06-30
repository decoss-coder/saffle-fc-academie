import Link from "next/link";
import { CLUB } from "@/lib/club";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-800 px-6 py-5">
        <div className="mx-auto flex max-w-md flex-col gap-1">
          <Link href="/" className="group">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              {CLUB.shortName}
            </p>
            <p className="text-lg font-semibold group-hover:text-emerald-300">
              Académie CI
            </p>
            <p className="text-sm text-zinc-400">{CLUB.location}</p>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
            {subtitle}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-zinc-400">{CLUB.tagline}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
