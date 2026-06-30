import { PlayerListStatus } from "@/lib/players/list-status";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";

type PlayerStatusBadgeProps = {
  status: PlayerListStatus;
  href?: string;
};

export function PlayerStatusBadge({ status, href }: PlayerStatusBadgeProps) {
  const badge = (
    <StatusBadge
      label={status.label}
      variant={status.variant}
      title={status.title}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        title={status.title}
        className="inline-block transition hover:opacity-90"
      >
        {badge}
      </Link>
    );
  }

  return badge;
}
