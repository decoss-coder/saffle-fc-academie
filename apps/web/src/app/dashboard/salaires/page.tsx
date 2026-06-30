import { DashboardShell } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { FinanceReadOnlyBanner } from "@/components/finance-read-only-banner";
import { StatusBadge } from "@/components/status-badge";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { rowCompact } from "@/lib/dashboard-ui";
import { formatFcfa, PAYMENT_METHOD_LABELS } from "@/lib/payments/constants";
import {
  SALARY_STATUS_LABELS,
  formatMonthLabel,
  salaryStatusVariant,
} from "@/lib/salaries/constants";
import { requireSalaryViewer, canManageSalaries } from "@/lib/permissions";
import {
  CancelSalaryForm,
  MarkPaidForm,
  SalaryLineForm,
} from "./salary-line-form";

export default async function SalairesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireSalaryViewer();
  const canManage = canManageSalaries(profile.role);
  const supabase = await createClient();

  const { data: coaches } = await supabase
    .from("phone_registry")
    .select("phone_normalized, full_name, position_title")
    .eq("role", "coach")
    .order("full_name");

  let query = supabase
    .from("staff_salary_lines")
    .select("*, phone_registry(full_name, position_title)")
    .order("period_month", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.month) query = query.eq("period_month", `${params.month}-01`);

  const { data: lines } = await query;

  return (
    <DashboardShell
      title="Salaires — coachs"
      breadcrumbs={[
        { label: "Finance", href: "/dashboard" },
        { label: "Salaires" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
    >
      {!canManage && <FinanceReadOnlyBanner />}

      <InfoBanner>
        Indemnités mensuelles des coachs. Seul le trésorier peut créer et
        enregistrer les paiements ; les administrateurs consultent en lecture seule.
      </InfoBanner>

      {canManage && (
        <SalaryLineForm
          coaches={(coaches ?? []).map((c) => ({
            phone: c.phone_normalized,
            label: `${c.full_name ?? "—"}${c.position_title ? ` — ${c.position_title}` : ""}`,
          }))}
        />
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        <a href="/dashboard/salaires" className="rounded-full border border-green-300 px-3 py-1">
          Tous
        </a>
        {(["pending", "paid", "cancelled"] as const).map((s) => (
          <a
            key={s}
            href={`/dashboard/salaires?status=${s}`}
            className="rounded-full border border-green-300 px-3 py-1 text-green-800"
          >
            {SALARY_STATUS_LABELS[s]}
          </a>
        ))}
      </div>

      {!lines?.length ? (
        <EmptyState message="Aucune ligne salaire." />
      ) : (
        <DataTable
          count={
            <ListCount count={lines.length} label="ligne" labelPlural="lignes" />
          }
        >
          <DataTableHead>
            <tr>
              <DataTableTh>Mois</DataTableTh>
              <DataTableTh>Coach</DataTableTh>
              <DataTableTh>Libellé</DataTableTh>
              <DataTableTh>Montant</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
              {canManage && <DataTableTh>Actions</DataTableTh>}
            </tr>
          </DataTableHead>
          <DataTableBody>
            {lines.map((line) => {
              const coach = line.phone_registry as {
                full_name?: string;
                position_title?: string;
              } | null;
              return (
                <tr key={line.id} className="border-b border-green-100">
                  <td className={rowCompact}>{formatMonthLabel(line.period_month)}</td>
                  <td className={rowCompact}>{coach?.full_name ?? "—"}</td>
                  <td className={rowCompact}>{line.label}</td>
                  <td className={rowCompact}>{formatFcfa(Number(line.amount))}</td>
                  <td className={rowCompact}>
                    <StatusBadge
                      label={SALARY_STATUS_LABELS[line.status] ?? line.status}
                      variant={salaryStatusVariant(line.status)}
                    />
                  </td>
                  {canManage && (
                    <td className={rowCompact}>
                      {line.status === "pending" && (
                        <div className="space-y-2">
                          <MarkPaidForm lineId={line.id} />
                          <CancelSalaryForm lineId={line.id} />
                        </div>
                      )}
                      {line.status === "paid" && line.payment_method && (
                        <span className="text-xs text-slate-600">
                          {PAYMENT_METHOD_LABELS[line.payment_method] ?? line.payment_method}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </DataTableBody>
        </DataTable>
      )}
    </DashboardShell>
  );
}
