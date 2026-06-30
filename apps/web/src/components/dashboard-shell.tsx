import Link from "next/link";
import { signOut } from "@/app/auth/actions";

const navItems = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/dashboard/joueurs", label: "Joueurs" },
];

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  userName: string;
  userRole: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({
  title,
  subtitle,
  userName,
  userRole,
  actions,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
              SAFFLE FC Académie · Sinfra
            </p>
            <p className="text-sm text-zinc-400">
              {userName} · {userRole}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-zinc-800 px-4 py-2 text-sm transition hover:border-zinc-600"
              >
                {item.label}
              </Link>
            ))}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm transition hover:border-zinc-500"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{title}</h1>
            {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
