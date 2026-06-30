import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/dashboard-ui";

export function DashboardBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="mt-2">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-slate-300">›</span>}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium text-slate-600 transition hover:text-green-800"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-slate-800" : "text-slate-600"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
