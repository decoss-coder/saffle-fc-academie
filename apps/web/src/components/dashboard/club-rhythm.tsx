import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { ClubRhythmMetric } from "@/lib/dashboard/rhythm";

type ClubRhythmProps = {
  metrics: ClubRhythmMetric[];
};

export function ClubRhythm({ metrics }: ClubRhythmProps) {
  if (!metrics.length) return null;

  return (
    <section className="rounded-2xl border border-[#dde6d6] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
        Rythme club
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            title={metric.title}
            className="rounded-2xl bg-[#f6f8f3] p-4 text-center ring-1 ring-[#e3eadf] transition hover:bg-[#eef4e9] hover:ring-[#b7c9ab]"
          >
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 text-lg font-semibold text-slate-950">
              {metric.value}
            </p>
            <div className="mt-3 flex justify-center">
              <StatusBadge
                label={
                  metric.variant === "good"
                    ? "Bon"
                    : metric.variant === "warn"
                      ? "À surveiller"
                      : metric.variant === "bad"
                        ? "Critique"
                        : "Neutre"
                }
                variant={metric.variant}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
