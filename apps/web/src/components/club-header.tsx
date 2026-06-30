import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";

type ClubHeaderProps = {
  children?: React.ReactNode;
};

export function ClubHeader({ children }: ClubHeaderProps) {
  return (
    <header className="border-b border-green-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <ClubLogo size="md" />
        {children ?? (
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="rounded-full border border-green-700 px-5 py-2 text-sm font-medium text-green-800 transition hover:bg-green-50"
            >
              Inscription
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Connexion
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
