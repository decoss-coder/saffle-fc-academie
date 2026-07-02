"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type AgentsTabsProps = {
  activeTab: "liste" | "ajouter" | "import";
  agentsCount: number;
  pendingCount: number;
};

export function AgentsTabs({
  activeTab,
  agentsCount,
  pendingCount,
}: AgentsTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tab: "liste" | "ajouter" | "import") => {
    if (tab === "liste") return pathname;
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
    <nav className="flex flex-wrap gap-2" aria-label="Agents">
      <Link href={buildHref("liste")} className={tabClass("liste")}>
        Liste
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
            activeTab === "liste"
              ? "bg-green-700 text-green-100"
              : "bg-green-100 text-green-800"
          }`}
        >
          {agentsCount}
        </span>
      </Link>
      <Link href={buildHref("ajouter")} className={tabClass("ajouter")}>
        Ajouter
      </Link>
      <Link href={buildHref("import")} className={tabClass("import")}>
        Import
        {pendingCount > 0 ? (
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
              activeTab === "import"
                ? "bg-green-700 text-green-100"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {pendingCount} non activés
          </span>
        ) : null}
      </Link>
    </nav>
  );
}
