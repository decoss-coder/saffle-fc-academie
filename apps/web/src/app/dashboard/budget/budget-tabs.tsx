"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type BudgetTabsProps = {
  activeTab: "liste" | "creer";
  budgetsCount: number;
  canCreate?: boolean;
};

export function BudgetTabs({
  activeTab,
  budgetsCount,
  canCreate = true,
}: BudgetTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tab: "liste" | "creer") => {
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
    <nav className="flex flex-wrap gap-2" aria-label="Budget">
      <Link href={buildHref("liste")} className={tabClass("liste")}>
        Budgets
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
            activeTab === "liste"
              ? "bg-green-700 text-green-100"
              : "bg-green-100 text-green-800"
          }`}
        >
          {budgetsCount}
        </span>
      </Link>
      {canCreate && (
        <Link href={buildHref("creer")} className={tabClass("creer")}>
          Créer
        </Link>
      )}
    </nav>
  );
}
