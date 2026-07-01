"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type PlayerDetailTabsProps = {
  playerId: string;
  activeTab: "profil" | "documents" | "acces" | "admin";
  canManage: boolean;
};

export function PlayerDetailTabs({
  playerId,
  activeTab,
  canManage,
}: PlayerDetailTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs: { key: PlayerDetailTabsProps["activeTab"]; label: string }[] = [
    { key: "profil", label: "Profil" },
    { key: "documents", label: "Documents" },
  ];
  if (canManage) {
    tabs.push({ key: "acces", label: "Accès parent" });
    tabs.push({ key: "admin", label: "Admin" });
  }

  const buildHref = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "profil") {
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
    <nav className="flex flex-wrap gap-2" aria-label={`Joueur ${playerId}`}>
      {tabs.map((tab) => (
        <Link key={tab.key} href={buildHref(tab.key)} className={tabClass(tab.key)}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
