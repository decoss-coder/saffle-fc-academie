"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type MesCotisationsTabsProps = {
  activeTab: "en-cours" | "historique";
  pendingCount: number;
  historyCount: number;
};

export function MesCotisationsTabs({
  activeTab,
  pendingCount,
  historyCount,
}: MesCotisationsTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tab: "en-cours" | "historique") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "en-cours") {
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
    <nav className="flex flex-wrap gap-2" aria-label="Mes cotisations">
      <Link href={buildHref("en-cours")} className={tabClass("en-cours")}>
        En cours
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
            activeTab === "en-cours"
              ? "bg-green-700 text-green-100"
              : "bg-green-100 text-green-800"
          }`}
        >
          {pendingCount}
        </span>
      </Link>
      <Link href={buildHref("historique")} className={tabClass("historique")}>
        Historique
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
            activeTab === "historique"
              ? "bg-green-700 text-green-100"
              : "bg-green-100 text-green-800"
          }`}
        >
          {historyCount}
        </span>
      </Link>
    </nav>
  );
}
