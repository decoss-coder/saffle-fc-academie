"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type ParentDetailTabsProps = {
  parentKey: string;
  activeTab: "enfants" | "paiements" | "convocations" | "documents" | "acces";
};

export function ParentDetailTabs({
  parentKey,
  activeTab,
}: ParentDetailTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = `/dashboard/parents/${parentKey}`;

  const tabs: { key: ParentDetailTabsProps["activeTab"]; label: string }[] = [
    { key: "enfants", label: "Enfants" },
    { key: "paiements", label: "Paiements" },
    { key: "convocations", label: "Convocations" },
    { key: "documents", label: "Documents" },
    { key: "acces", label: "Accès" },
  ];

  const buildHref = (tab: ParentDetailTabsProps["activeTab"]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "enfants") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const tabClass = (tab: string) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-green-800 text-white"
        : "border border-green-300 text-green-800 hover:bg-green-50"
    }`;

  return (
    <nav className="flex flex-wrap gap-2" aria-label={`Parent ${parentKey}`}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={buildHref(tab.key)}
          className={tabClass(tab.key)}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
