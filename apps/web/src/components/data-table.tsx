import Link from "next/link";
import {
  buildSortHref,
  tableBodyClass,
  tableClass,
  tableHeadCellClass,
  tableHeadClass,
  tableShell,
  type SortDir,
} from "@/lib/dashboard-ui";

export function ListCount({
  count,
  label,
  labelPlural,
}: {
  count: number;
  label: string;
  labelPlural?: string;
}) {
  const plural = labelPlural ?? `${label}s`;
  return (
    <p className="text-sm text-slate-600">
      <span className="font-semibold text-slate-900">{count}</span>{" "}
      {count <= 1 ? label : plural}
    </p>
  );
}

type SortableThProps = {
  label: string;
  sortKey: string;
  basePath: string;
  params: Record<string, string | undefined>;
  currentSort?: string;
  currentDir?: SortDir;
};

export function SortableTh({
  label,
  sortKey,
  basePath,
  params,
  currentSort,
  currentDir,
}: SortableThProps) {
  const active = currentSort === sortKey;
  const arrow = active ? (currentDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <th className={tableHeadCellClass}>
      <Link
        href={buildSortHref(basePath, params, sortKey, currentSort, currentDir)}
        className="inline-flex items-center gap-1 hover:text-white"
      >
        {label}
        <span className="text-green-200">{arrow}</span>
      </Link>
    </th>
  );
}

type DataTableProps = {
  children: React.ReactNode;
  count?: React.ReactNode;
};

export function DataTable({ children, count }: DataTableProps) {
  return (
    <div className="space-y-3">
      {count}
      <div className={tableShell}>
        <table className={tableClass}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return <thead className={tableHeadClass}>{children}</thead>;
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className={tableBodyClass}>{children}</tbody>;
}

export function DataTableTh({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={`${tableHeadCellClass} ${className}`}>{children}</th>;
}
