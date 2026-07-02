"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComiteTab } from "@/lib/resolve-comite-tab";

export type { ComiteTab };

type ComiteTabsProps = {
  activeTab: ComiteTab;
  canManage?: boolean;
  cotisationsCount: number;
  membresCount: number;
  pendingWaveCount: number;
};

export function ComiteTabs({
  activeTab,
  canManage = true,
  cotisationsCount,
  membresCount,
  pendingWaveCount,
}: ComiteTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tab: ComiteTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "cotisations") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const tabClass = (tab: ComiteTab) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-green-800 text-white"
        : "border border-green-300 text-green-800 hover:bg-green-50"
    }`;

  const countBadge = (tab: ComiteTab, count: number) => (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
        activeTab === tab
          ? "bg-green-700 text-green-100"
          : "bg-green-100 text-green-800"
      }`}
    >
      {count}
    </span>
  );

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Comité directeur">
      <Link href={buildHref("cotisations")} className={tabClass("cotisations")}>
        Cotisations
        {pendingWaveCount > 0
          ? countBadge("cotisations", pendingWaveCount)
          : countBadge("cotisations", cotisationsCount)}
      </Link>
      <Link href={buildHref("membres")} className={tabClass("membres")}>
        Membres
        {countBadge("membres", membresCount)}
      </Link>
      {canManage && (
        <Link href={buildHref("creer")} className={tabClass("creer")}>
          Créer
        </Link>
      )}
    </nav>
  );
}
