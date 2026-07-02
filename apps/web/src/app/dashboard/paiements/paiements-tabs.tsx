"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type PaiementsTabsProps = {
  activeTab: "suivi" | "wave" | "creer" | "historique";
  canManage?: boolean;
  pendingWaveCount?: number;
};

export function PaiementsTabs({
  activeTab,
  canManage = true,
  pendingWaveCount = 0,
}: PaiementsTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tab: string) => {
    if (tab === "historique") return "/dashboard/paiements/historique";
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
        Cotisations
      </Link>
      {canManage && (
        <Link href={buildHref("wave")} className={tabClass("wave")}>
          Wave
          {pendingWaveCount > 0 && (
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "wave"
                  ? "bg-green-700 text-green-100"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {pendingWaveCount}
            </span>
          )}
        </Link>
      )}
      {canManage && (
        <Link href={buildHref("creer")} className={tabClass("creer")}>
          Créer
        </Link>
      )}
      <Link href={buildHref("historique")} className={tabClass("historique")}>
        Historique
      </Link>
    </nav>
  );
}
