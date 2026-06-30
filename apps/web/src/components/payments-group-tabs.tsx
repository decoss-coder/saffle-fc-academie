import Link from "next/link";
import { PLAYER_GROUPS } from "@/lib/players/constants";

type PaymentsGroupTabsProps = {
  activeTeam: string;
  counts: Record<string, number>;
};

export function PaymentsGroupTabs({
  activeTeam,
  counts,
}: PaymentsGroupTabsProps) {
  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Catégories de cotisations"
    >
      {PLAYER_GROUPS.map((group) => {
        const isActive = activeTeam === group.team;
        const count = counts[group.team] ?? 0;

        return (
          <Link
            key={group.team}
            href={`/dashboard/paiements?groupe=${encodeURIComponent(group.team)}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-green-800 text-white"
                : "border border-green-300 text-green-800 hover:bg-green-50"
            }`}
          >
            {group.team}
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
