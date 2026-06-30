import Link from "next/link";
import { cardLinkClass, chevronClass } from "@/lib/dashboard-ui";

type ClickableCardProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function ClickableCard({ href, children, className = "" }: ClickableCardProps) {
  return (
    <Link href={href} className={`${cardLinkClass} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        <span className={chevronClass} aria-hidden>
          ›
        </span>
      </div>
    </Link>
  );
}
