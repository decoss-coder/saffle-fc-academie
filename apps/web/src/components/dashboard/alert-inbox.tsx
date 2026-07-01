import Link from "next/link";
import type { DashboardAlert } from "@/lib/dashboard/alerts";
import { ClickableCard } from "@/components/clickable-card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { navActionClass } from "@/lib/dashboard-ui";

type AlertInboxProps = {
  alerts: DashboardAlert[];
  viewAllHref?: string;
};

export function AlertInbox({ alerts, viewAllHref }: AlertInboxProps) {
  return (
    <section className="rounded-2xl border border-[#dde6d6] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            À traiter
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {alerts.length > 0
              ? `${alerts.length} point(s) nécessitent votre attention`
              : "Aucune urgence pour le moment"}
          </p>
        </div>
        {viewAllHref && alerts.length > 0 ? (
          <Link href={viewAllHref} className={navActionClass}>
            Tout voir
          </Link>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        {alerts.length === 0 ? (
          <EmptyState message="Rien d'urgent aujourd'hui. Bonne journée !" />
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <ClickableCard key={alert.id} href={alert.href}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <StatusBadge label={alert.module} variant={alert.variant} />
                  <div>
                    <p className="font-semibold text-slate-950">{alert.title}</p>
                    {alert.detail ? (
                      <p className="mt-1 text-sm text-slate-600">{alert.detail}</p>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-2xl font-semibold tabular-nums text-slate-950">
                  {alert.count}
                </span>
              </div>
            </ClickableCard>
          ))
        )}
      </div>
    </section>
  );
}
