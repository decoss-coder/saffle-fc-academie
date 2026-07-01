import { ClickableCard } from "@/components/clickable-card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import type { UpcomingEvent } from "@/lib/dashboard/events";
import { formatDateTime } from "@/lib/convocations/constants";

type UpcomingEventsProps = {
  events: UpcomingEvent[];
  title?: string;
};

export function UpcomingEvents({
  events,
  title = "Prochains événements",
}: UpcomingEventsProps) {
  return (
    <section className="rounded-2xl border border-[#dde6d6] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <div className="mt-5 space-y-3">
        {events.length === 0 ? (
          <EmptyState message="Aucun événement à venir pour le moment." />
        ) : (
          events.map((event) => (
            <ClickableCard key={event.id} href={event.href}>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={event.eventTypeLabel}
                    variant={event.pending > 0 ? "warn" : "good"}
                  />
                  {event.pending > 0 ? (
                    <StatusBadge
                      label={`${event.pending} en attente`}
                      variant="warn"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDateTime(event.eventDate)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                  {event.subtitle ? (
                    <p className="mt-1 text-sm font-medium text-[#245b3a]">
                      {event.subtitle}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      {event.responded}/{event.invited} réponse
                      {event.invited > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </ClickableCard>
          ))
        )}
      </div>
    </section>
  );
}
