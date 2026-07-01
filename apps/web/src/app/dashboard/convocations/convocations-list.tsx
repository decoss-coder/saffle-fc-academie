import Link from "next/link";
import { ClickableCard } from "@/components/clickable-card";
import { EmptyState } from "@/components/empty-state";
import { ListCount } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { primaryActionClass } from "@/lib/dashboard-ui";
import {
  formatDateTime,
  formatEventType,
} from "@/lib/convocations/constants";

export type ConvocationListItem = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  location: string | null;
  invited: number;
  pending: number;
  responded: number;
};

type ConvocationsListProps = {
  upcoming: ConvocationListItem[];
  past: ConvocationListItem[];
};

function ConvocationCard({ item }: { item: ConvocationListItem }) {
  const isUpcoming = new Date(item.event_date).getTime() > Date.now();

  return (
    <ClickableCard href={`/dashboard/convocations/${item.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={formatEventType(item.event_type)}
              variant="neutral"
            />
            {isUpcoming && item.pending > 0 ? (
              <StatusBadge
                label={`${item.pending} en attente`}
                variant="warn"
              />
            ) : null}
            {!isUpcoming ? (
              <StatusBadge label="Passée" variant="neutral" />
            ) : null}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">{item.title}</h3>
            <p className="mt-1 text-sm text-green-700">
              {formatDateTime(item.event_date)}
              {item.location ? ` · ${item.location}` : ""}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {item.responded}/{item.invited} réponse
              {item.invited > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </ClickableCard>
  );
}

function ConvocationSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: ConvocationListItem[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-green-900">{title}</h2>
        <ListCount
          count={items.length}
          label="convocation"
          labelPlural="convocations"
        />
      </div>
      {!items.length ? (
        <p className="rounded-2xl border border-dashed border-green-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ConvocationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export function ConvocationsList({ upcoming, past }: ConvocationsListProps) {
  const total = upcoming.length + past.length;

  if (!total) {
    return (
      <EmptyState message="Aucune convocation pour le moment.">
        <Link href="/dashboard/convocations?tab=creer" className={primaryActionClass}>
          Créer une convocation
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <ConvocationSection
        title="À venir"
        items={upcoming}
        emptyMessage="Aucune convocation planifiée."
      />
      <ConvocationSection
        title="Passées"
        items={past}
        emptyMessage="Aucune convocation passée enregistrée."
      />
    </div>
  );
}
