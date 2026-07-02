"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "enfants", label: "Mes enfants", href: "/dashboard/parent" },
  {
    key: "convocations",
    label: "Convocations",
    href: "/dashboard/parent/convocations",
  },
  { key: "paiements", label: "Paiements", href: "/dashboard/parent/paiements" },
  { key: "documents", label: "Documents", href: "/dashboard/mes-documents" },
] as const;

export type ParentTabKey = (typeof TABS)[number]["key"];

type ParentTabsProps = {
  activeTab: ParentTabKey;
};

export function ParentTabs({ activeTab }: ParentTabsProps) {
  const pathname = usePathname();

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? "bg-green-800 text-white"
        : "border border-green-300 text-green-800 hover:bg-green-50"
    }`;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Parent">
      {TABS.map((tab) => {
        const isActive =
          tab.key === activeTab ||
          (tab.key === "enfants" && pathname === tab.href) ||
          (tab.key !== "enfants" && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={tabClass(isActive)}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
