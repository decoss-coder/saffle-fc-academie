import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/auth/actions";
import { CLUB } from "@/lib/club";
import { canManagePhones } from "@/lib/auth";

const baseNavItems = [
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
  const navItems = canManagePhones(userRole)
    ? [
        ...baseNavItems,
        { href: "/dashboard/admin/telephones", label: "Accès téléphone" },
      ]
    : baseNavItems;

  return (
    <div className="flex min-h-full flex-col bg-green-50">
      <header className="border-b border-green-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src={CLUB.assets.logo}
              alt={CLUB.name}
              width={44}
              height={44}
              className="rounded-full ring-2 ring-green-600/20"
            />
            <div>
              <p className="text-sm font-semibold leading-tight text-green-900">
                {CLUB.name}
              </p>
              <p className="text-xs text-green-700">
                {userName} · {userRole}
              </p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-green-200 px-4 py-2 text-sm text-green-800 transition hover:border-green-500 hover:bg-green-50"
              >
                {item.label}
              </Link>
            ))}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-green-300 px-4 py-2 text-sm text-green-800 transition hover:bg-green-100"
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
            <h1 className="text-3xl font-semibold text-green-900">{title}</h1>
            {subtitle && <p className="mt-2 text-green-700">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
