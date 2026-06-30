"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type PaiementsTabsProps = {
  activeTab: "suivi" | "creer";
};

export function PaiementsTabs({ activeTab }: PaiementsTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    return `${pathname}?${params.toString()}`;
  };

  const tabClass = (tab: string) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-green-800 text-white"
        : "border border-green-300 text-green-800 hover:bg-green-50"
    }`;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Paiements">
      <Link href={buildHref("suivi")} className={tabClass("suivi")}>
        Suivi
      </Link>
      <Link href={buildHref("creer")} className={tabClass("creer")}>
        Créer
      </Link>
    </nav>
  );
}
