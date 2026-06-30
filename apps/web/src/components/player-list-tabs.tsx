import Link from "next/link";
import { PLAYER_GROUPS } from "@/lib/players/constants";

type PlayerListTabsProps = {
  activeTeam: string;
  counts: Record<string, number>;
  searchQuery?: string;
};

export function PlayerListTabs({
  activeTeam,
  counts,
  searchQuery,
}: PlayerListTabsProps) {
  const querySuffix = searchQuery
    ? `&q=${encodeURIComponent(searchQuery)}`
    : "";

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-green-200 pb-1 sm:border-b-0"
      aria-label="Groupes de joueurs"
    >
      {PLAYER_GROUPS.map((group) => {
        const isActive = activeTeam === group.team;
        const count = counts[group.team] ?? 0;
        const shortLabel = group.team;

        return (
          <Link
            key={group.team}
            href={`/dashboard/joueurs?groupe=${encodeURIComponent(group.team)}${querySuffix}`}
            className={`rounded-t-xl px-4 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-green-800 text-white shadow-sm"
                : "bg-white text-green-800 hover:bg-green-50"
            }`}
          >
            {shortLabel}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                isActive ? "bg-green-700 text-green-100" : "bg-green-100 text-green-800"
              }`}
            >
              {count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
