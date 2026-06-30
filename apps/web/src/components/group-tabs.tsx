import Link from "next/link";

export type GroupTabItem = {
  key: string;
  label: string;
  count: number;
  href: string;
};

type GroupTabsProps = {
  items: GroupTabItem[];
  activeKey: string;
  variant?: "underline" | "pill";
  ariaLabel?: string;
};

export function GroupTabs({
  items,
  activeKey,
  variant = "underline",
  ariaLabel = "Groupes",
}: GroupTabsProps) {
  const sorted = [...items].sort((a, b) => {
    if (a.count === 0 && b.count > 0) return 1;
    if (b.count === 0 && a.count > 0) return -1;
    return 0;
  });

  return (
    <nav
      className={`flex flex-wrap gap-2 ${variant === "underline" ? "border-b border-green-200 pb-1 sm:border-b-0" : ""}`}
      aria-label={ariaLabel}
    >
      {sorted.map((item) => {
        const isActive = activeKey === item.key;
        const isEmpty = item.count === 0;
        const base =
          variant === "pill"
            ? `rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-green-800 text-white"
                  : "border border-green-300 text-green-800 hover:bg-green-50"
              }`
            : `rounded-t-xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-green-800 text-white shadow-sm"
                  : "bg-white text-green-800 hover:bg-green-50"
              }`;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`${base} ${isEmpty && !isActive ? "opacity-50" : ""}`}
          >
            {item.label}
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                isActive
                  ? "bg-green-700 text-green-100"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {item.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
