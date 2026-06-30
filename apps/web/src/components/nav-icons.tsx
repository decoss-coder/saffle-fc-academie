import type { ComponentType, ReactNode } from "react";

type NavIconProps = { className?: string };

function IconBase({
  className = "h-4 w-4",
  children,
}: NavIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function NavIconHome({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </IconBase>
  );
}

export function NavIconBell({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <path d="M18 16H6l1.2-1.6A2 2 0 0 0 8 13.2V10a4 4 0 1 1 8 0v3.2c0 .5.2 1 .6 1.2z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function NavIconUsers({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 20c.3-2.2 1.8-3.5 4-3.5" />
    </IconBase>
  );
}

export function NavIconBall({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" />
    </IconBase>
  );
}

export function NavIconDoc({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <path d="M8 4h7l3 3v13H8z" />
      <path d="M15 4v4h4M10 12h6M10 16h6" />
    </IconBase>
  );
}

export function NavIconCalendar({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </IconBase>
  );
}

export function NavIconWallet({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M3 11h18M16 15h2" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </IconBase>
  );
}

export function NavIconBuilding({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 20V6l8-3 8 3v14" />
      <path d="M9 20v-5h6v5M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </IconBase>
  );
}

export function NavIconChart({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16V12M12 16V8M16 16v-6" />
    </IconBase>
  );
}

export function NavIconShield({ className }: NavIconProps) {
  return (
    <IconBase className={className}>
      <path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6z" />
    </IconBase>
  );
}

const NAV_ICON_MAP: Record<string, ComponentType<NavIconProps>> = {
  "/dashboard": NavIconHome,
  "/dashboard/notifications": NavIconBell,
  "/dashboard/mes-documents": NavIconDoc,
  "/dashboard/parent": NavIconUsers,
  "/dashboard/parent/convocations": NavIconCalendar,
  "/dashboard/parent/paiements": NavIconWallet,
  "/dashboard/joueurs": NavIconBall,
  "/dashboard/documents": NavIconDoc,
  "/dashboard/convocations": NavIconCalendar,
  "/dashboard/club": NavIconBuilding,
  "/dashboard/paiements": NavIconWallet,
  "/dashboard/comite": NavIconUsers,
  "/dashboard/comite/mes-cotisations": NavIconWallet,
  "/dashboard/salaires": NavIconWallet,
  "/dashboard/player/paiements": NavIconWallet,
  "/dashboard/paiements/historique": NavIconWallet,
  "/dashboard/budget": NavIconChart,
  "/dashboard/admin/telephones": NavIconShield,
};

export function NavIconForHref({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const Icon = NAV_ICON_MAP[href] ?? NavIconDoc;
  return <Icon className={className} />;
}
