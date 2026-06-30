import { StatusBadge } from "@/components/status-badge";
import {
  DUE_STATUS_LABELS,
  dueStatusVariant,
} from "@/lib/payments/constants";

export function DueStatusBadge({ status }: { status: string }) {
  return (
    <StatusBadge
      label={DUE_STATUS_LABELS[status] ?? status}
      variant={dueStatusVariant(status)}
    />
  );
}
