import Link from "next/link";
import {
  STATUS_VARIANT_CLASSES,
  type PlayerListStatus,
} from "@/lib/players/list-status";

type PlayerStatusBadgeProps = {
  status: PlayerListStatus;
  href?: string;
};

export function PlayerStatusBadge({ status, href }: PlayerStatusBadgeProps) {
  const className = `inline-flex rounded-full px-2.5 py-1 text-xs font-medium transition ${STATUS_VARIANT_CLASSES[status.variant]} ${
    href ? "hover:ring-2 hover:ring-green-400 hover:ring-offset-1" : ""
  }`;

  if (href) {
    return (
      <Link href={href} title={status.title} className={className}>
        {status.label}
      </Link>
    );
  }

  return (
    <span title={status.title} className={className}>
      {status.label}
    </span>
  );
}
