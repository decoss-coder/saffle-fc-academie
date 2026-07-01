import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/app/auth/actions";
import { CLUB } from "@/lib/club";
import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs";
import { NavIconForHref } from "@/components/nav-icons";
import type { BreadcrumbItem } from "@/lib/dashboard-ui";
import {
  canManageBudget,
  canManageClub,
  canManageConvocations,
  canManagePhones,
  canManagePlayers,
  canUploadDocuments,
  isParentRole,
  isPlayerAccountRole,
} from "@/lib/auth";
import {
  canViewFinance,
  canViewSalaries,
  isCommitteeRegistryRole,
} from "@/lib/permissions";

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  userName: string;
  userRole: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function buildNavItems(userRole: string) {
  const items: { href: string; label: string; group: string }[] = [
    { href: "/dashboard", label: "Accueil", group: "Pilotage" },
    {
      href: "/dashboard/notifications",
      label: "Notifications",
      group: "Pilotage",
    },
  ];

  if (isParentRole(userRole) || canUploadDocuments(userRole)) {
    items.push({
      href: "/dashboard/mes-documents",
      label: "Documents",
      group: "Famille",
    });
  }

  if (isParentRole(userRole)) {
    items.push(
      {
        href: "/dashboard/parent",
        label: "Mes enfants",
        group: "Famille",
      },
      {
        href: "/dashboard/parent/convocations",
        label: "Convocations",
        group: "Famille",
      },
      {
        href: "/dashboard/parent/paiements",
        label: "Paiements",
        group: "Famille",
      },
    );
  }

  if (isPlayerAccountRole(userRole)) {
    items.push({
      href: "/dashboard/player/paiements",
      label: "Mes paiements",
      group: "Famille",
    });
  }

  if (canManagePlayers(userRole)) {
    items.push(
      {
        href: "/dashboard/joueurs",
        label: "Joueurs",
        group: "Club",
      },
      {
        href: "/dashboard/documents",
        label: "Documents",
        group: "Club",
      },
    );
  }

  if (canManageConvocations(userRole)) {
    items.push({
      href: "/dashboard/convocations",
      label: "Convocations",
      group: "Club",
    });
  }

  if (canManageClub(userRole)) {
    items.push({
      href: "/dashboard/club",
      label: "Vie du club",
      group: "Club",
    });
  }

  if (canViewFinance(userRole)) {
    items.push({
      href: "/dashboard/paiements",
      label: "Paiements",
      group: "Finance",
    });
    items.push({
      href: "/dashboard/comite",
      label: "Comité directeur",
      group: "Finance",
    });
  }

  if (canViewSalaries(userRole)) {
    items.push({
      href: "/dashboard/salaires",
      label: "Salaires",
      group: "Finance",
    });
  }

  if (isCommitteeRegistryRole(userRole)) {
    items.push({
      href: "/dashboard/comite/mes-cotisations",
      label: "Mes cotisations comité",
      group: "Finance",
    });
  }

  if (canManageBudget(userRole) || userRole === "board") {
    items.push({
      href: "/dashboard/budget",
      label: "Budget",
      group: "Finance",
    });
  }

  if (canManagePhones(userRole)) {
    items.push({
      href: "/dashboard/admin/telephones",
      label: "Membres",
      group: "Administration",
    });
  }

  return items;
}

function groupNavItems(items: ReturnType<typeof buildNavItems>) {
  return items.reduce<Record<string, typeof items>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item];
    return groups;
  }, {});
}

export function DashboardShell({
  title,
  subtitle,
  breadcrumbs,
  userName,
  userRole,
  actions,
  children,
}: DashboardShellProps) {
  const navItems = buildNavItems(userRole);
  const navGroups = groupNavItems(navItems);

  return (
    <div className="min-h-full bg-[#f5f7f2] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[#dce4d4] bg-[#071c16] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src={CLUB.assets.logo}
                alt={CLUB.name}
                width={50}
                height={50}
                className="rounded-xl bg-white object-cover ring-1 ring-white/20"
              />
              <div>
                <p className="text-sm font-semibold leading-tight">{CLUB.name}</p>
                <p className="text-xs text-emerald-100/70">{CLUB.city}</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
            {Object.entries(navGroups).map(([group, items]) => (
              <div key={group}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/50">
                  {group}
                </p>
                <div className="mt-3 space-y-1">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-50/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-emerald-100 ring-1 ring-white/10">
                        <NavIconForHref href={item.href} className="h-4 w-4" />
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
              <p className="text-sm font-medium">{userName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-emerald-100/60">
                {userRole}
              </p>
              <form action={signOut} className="mt-4">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#dce4d4] bg-[#f8faf6]/90 backdrop-blur lg:hidden">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
              <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
                <Image
                  src={CLUB.assets.logo}
                  alt={CLUB.name}
                  width={42}
                  height={42}
                  className="rounded-xl bg-white object-cover ring-1 ring-slate-900/10"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">
                    {CLUB.shortName}
                  </p>
                  <p className="text-xs text-slate-500">Académie CI</p>
                </div>
              </Link>
              {actions}
            </div>
            <div className="flex gap-2 overflow-x-auto border-t border-[#e3eadf] px-4 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full border border-[#d8e2d2] bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                    {title}
                  </h1>
                  {breadcrumbs && breadcrumbs.length > 0 ? (
                    <DashboardBreadcrumbs items={breadcrumbs} />
                  ) : null}
                  {subtitle ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
                <div className="hidden shrink-0 lg:flex">{actions}</div>
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
