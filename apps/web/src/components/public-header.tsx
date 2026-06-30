import Image from "next/image";
import Link from "next/link";
import { CLUB } from "@/lib/club";

type PublicHeaderProps = {
  actionHref: string;
  actionLabel: string;
  actionVariant?: "outline" | "solid";
  className?: string;
};

export function PublicHeader({
  actionHref,
  actionLabel,
  actionVariant = "outline",
  className = "",
}: PublicHeaderProps) {
  const actionClass =
    actionVariant === "solid"
      ? "flex min-h-11 items-center justify-center rounded-md bg-[#d3ad45] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#071c16] transition hover:bg-[#e4c464] sm:px-6 sm:text-sm"
      : "flex min-h-11 items-center justify-center rounded-md border border-[#d3ad45]/38 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#d3ad45] transition hover:bg-[#d3ad45] hover:text-[#071c16] sm:px-6 sm:text-sm";

  return (
    <header
      className={`shrink-0 border-b border-white/10 bg-[#071c16]/88 backdrop-blur-md ${className}`}
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4 px-5 py-3 sm:max-w-7xl sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src={CLUB.assets.logo}
            alt={CLUB.name}
            width={44}
            height={44}
            className="rounded-2xl bg-white object-cover p-1 shadow-lg shadow-black/20 ring-1 ring-white/20"
            priority
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.08em] text-white">
              {CLUB.shortName}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d3ad45]">
              Académie CI
            </p>
          </div>
        </Link>
        <Link href={actionHref} className={actionClass}>
          {actionLabel}
        </Link>
      </div>
    </header>
  );
}
