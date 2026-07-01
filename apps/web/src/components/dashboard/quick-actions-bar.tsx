import Link from "next/link";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";

type QuickActionsBarProps = {
  actions: { label: string; href: string }[];
};

export function QuickActionsBar({ actions }: QuickActionsBarProps) {
  if (!actions.length) return null;

  return (
    <section className="rounded-2xl border border-[#dde6d6] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
          Actions rapides
        </p>
        <p className="text-sm text-slate-500">
          Accès directs aux opérations les plus fréquentes.
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href}
            className={index === 0 ? primaryActionClass : navActionClass}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
