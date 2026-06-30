import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";

type ClubHeaderProps = {
  children?: React.ReactNode;
};

export function ClubHeader({ children }: ClubHeaderProps) {
  return (
    <header className="border-b border-emerald-900/40 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <ClubLogo size="md" />
        {children ?? (
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="rounded-full border border-emerald-700/50 px-5 py-2 text-sm transition hover:border-emerald-500"
            >
              Inscription
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Connexion
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
