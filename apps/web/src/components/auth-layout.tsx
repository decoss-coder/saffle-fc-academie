import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";
import { CLUB } from "@/lib/club";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950">
      <header className="border-b border-emerald-900/30 px-6 py-5">
        <div className="mx-auto max-w-md">
          <ClubLogo size="sm" href="/" />
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-emerald-900/30 bg-zinc-900/60 p-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
            {subtitle}
          </p>
          <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {CLUB.name} · {CLUB.tagline}
          </p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
