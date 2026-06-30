import Link from "next/link";
import { chevronClass, rowCompact } from "@/lib/dashboard-ui";

type ClickableTableRowProps = {
  href: string;
  children: React.ReactNode;
};

export function ClickableTableRow({ href, children }: ClickableTableRowProps) {
  return (
    <tr className="group hover:bg-green-50">
      {children}
      <td className={`${rowCompact} w-10 text-right`}>
        <Link
          href={href}
          className={`${chevronClass} inline-block`}
          aria-label="Ouvrir la fiche"
        >
          ›
        </Link>
      </td>
    </tr>
  );
}

export function PlayerCellLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <td className={rowCompact}>
      <Link href={href} className="block min-w-0">
        {children}
      </Link>
    </td>
  );
}
