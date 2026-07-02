"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type ClubTabItem = {
  id: string;
  label: string;
  count?: number;
};

type ClubModuleTabsProps = {
  tabs: ClubTabItem[];
  activeTab: string;
  defaultTab: string;
  preserveParams?: string[];
  ariaLabel: string;
};

export function ClubModuleTabs({
  tabs,
  activeTab,
  defaultTab,
  preserveParams = [],
  ariaLabel,
}: ClubModuleTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tabId: string) => {
    const params = new URLSearchParams();
    for (const key of preserveParams) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    if (tabId !== defaultTab) {
      params.set("tab", tabId);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const tabClass = (tabId: string) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      activeTab === tabId
        ? "bg-green-800 text-white"
        : "border border-green-300 text-green-800 hover:bg-green-50"
    }`;

  return (
    <nav className="flex flex-wrap gap-2" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <Link key={tab.id} href={buildHref(tab.id)} className={tabClass(tab.id)}>
          {tab.label}
          {tab.count !== undefined ? (
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id
                  ? "bg-green-700 text-green-100"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {tab.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

