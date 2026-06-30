export const matriculeClass = "font-mono text-xs text-slate-600";

export type StatusVariant = "good" | "warn" | "bad" | "neutral";

export const STATUS_VARIANT_CLASSES: Record<StatusVariant, string> = {
  good: "bg-green-100 text-green-900",
  warn: "bg-amber-100 text-amber-900",
  bad: "bg-red-100 text-red-900",
  neutral: "bg-gray-100 text-gray-700",
};

export const primaryActionClass =
  "rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700";

export const navActionClass =
  "rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

export const tableShell =
  "overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm";

export const tableClass = "min-w-full divide-y divide-green-100 text-sm";

export const tableHeadClass = "bg-green-800 text-left text-green-100";

export const tableHeadCellClass = "px-4 py-2.5 font-medium";

export const tableBodyClass = "divide-y divide-green-100";

export const rowCompact = "px-4 py-2.5";

export const avatarFallbackClass =
  "flex items-center justify-center rounded-full bg-emerald-900/10 font-semibold text-emerald-950 ring-2 ring-emerald-200/80";

export const cardLinkClass =
  "group block rounded-2xl border border-green-200 bg-white p-5 shadow-sm transition hover:border-green-400 hover:bg-green-50";

export const chevronClass =
  "ml-auto shrink-0 text-lg text-slate-400 transition group-hover:text-green-800";

export function formatRelativeDate(date: string | Date): string {
  const then = new Date(date).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "à venir";
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} j`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
  return new Intl.DateTimeFormat("fr-CI", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export type BreadcrumbItem = { label: string; href?: string };

export type SortDir = "asc" | "desc";

export function buildSortHref(
  basePath: string,
  params: Record<string, string | undefined>,
  sortKey: string,
  currentSort?: string,
  currentDir?: SortDir,
): string {
  const nextDir: SortDir =
    currentSort === sortKey && currentDir === "asc" ? "desc" : "asc";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  search.set("sort", sortKey);
  search.set("dir", nextDir);
  return `${basePath}?${search.toString()}`;
}
