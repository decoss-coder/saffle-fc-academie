"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type SalairesTabsProps = {
  activeTab: "liste" | "creer";
  canManage: boolean;
};

export function SalairesTabs({ activeTab, canManage }: SalairesTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "liste") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const tabClass = (tab: string) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-green-800 text-white"
        : "border border-green-300 text-green-800 hover:bg-green-50"
    }`;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Salaires">
      <Link href={buildHref("liste")} className={tabClass("liste")}>
        Liste
      </Link>
      {canManage && (
        <Link href={buildHref("creer")} className={tabClass("creer")}>
          Créer
        </Link>
      )}
    </nav>
  );
}
