"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type ParentListTabsProps = {
  activeTab: "tous" | "actifs" | "en-attente";
  totalCount: number;
  activeCount: number;
  pendingCount: number;
};

export function ParentListTabs({
  activeTab,
  totalCount,
  activeCount,
  pendingCount,
}: ParentListTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs: {
    key: ParentListTabsProps["activeTab"];
    label: string;
    count: number;
  }[] = [
    { key: "tous", label: "Tous", count: totalCount },
    { key: "actifs", label: "Compte activé", count: activeCount },
    { key: "en-attente", label: "En attente", count: pendingCount },
  ];

  const buildHref = (tab: ParentListTabsProps["activeTab"]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "tous") {
      params.delete("statut");
    } else {
      params.set("statut", tab);
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
    <nav className="flex flex-wrap gap-2" aria-label="Filtres parents">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={buildHref(tab.key)}
          className={tabClass(tab.key)}
        >
          {tab.label}
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
              activeTab === tab.key
                ? "bg-green-700 text-green-100"
                : "bg-green-100 text-green-800"
            }`}
          >
            {tab.count}
          </span>
        </Link>
      ))}
    </nav>
  );
}
