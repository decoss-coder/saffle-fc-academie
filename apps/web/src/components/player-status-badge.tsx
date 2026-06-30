import {
  STATUS_VARIANT_CLASSES,
  type PlayerListStatus,
} from "@/lib/players/list-status";

export function PlayerStatusBadge({ status }: { status: PlayerListStatus }) {
  return (
    <span
      title={status.title}
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_VARIANT_CLASSES[status.variant]}`}
    >
      {status.label}
    </span>
  );
}
