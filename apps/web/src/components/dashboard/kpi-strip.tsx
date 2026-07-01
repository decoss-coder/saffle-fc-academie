import type { DashboardKpi } from "@/lib/dashboard/alerts";

type KpiStripProps = {
  items: DashboardKpi[];
};

export function KpiStrip({ items }: KpiStripProps) {
  if (!items.length) return null;

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      aria-label="Indicateurs clés"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-[#dde6d6] bg-white p-4 shadow-sm"
        >
          <p className="text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">
            {item.value}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">{item.label}</p>
        </div>
      ))}
    </section>
  );
}
