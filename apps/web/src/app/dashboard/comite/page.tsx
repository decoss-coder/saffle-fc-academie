import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { COMMITTEE_ROLES } from "@/lib/budget/constants";
import { formatRole } from "@/lib/roles";
import { ClubSection } from "@/components/club-ui";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { FinanceReadOnlyBanner } from "@/components/finance-read-only-banner";
import { LiveSearch } from "@/components/live-search";
import { unwrapRelation } from "@/lib/supabase/relation";
import { requireFinanceSession } from "@/lib/permissions";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import {
  BulkDueForm,
  CommitteePaymentForm,
  SingleDueForm,
} from "./comite-client";
import { ComiteTabs } from "./comite-tabs";
import { resolveComiteTab } from "@/lib/resolve-comite-tab";
import { confirmCommitteePayment, cancelCommitteeDue, updateCommitteeDue } from "./actions";
import { DueManageActions } from "@/components/due-manage-actions";
import { DueStatusBadge } from "@/components/due-status-badge";
import { formatFcfa } from "@/lib/payments/constants";

export default async function ComitePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; wave?: string }>;
}) {
  const params = await searchParams;
  const { profile, canManage } = await requireFinanceSession();
  const activeTab = resolveComiteTab(params.tab, canManage);
  const query = params.q?.trim().toLowerCase() ?? "";
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("phone_registry")
    .select("phone_normalized, full_name, role, position_title")
    .in("role", [...COMMITTEE_ROLES])
    .order("full_name");

  const { data: dues } = await supabase
    .from("committee_dues")
    .select("*, phone_registry(full_name, role, position_title)")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  const { data: pendingWave } = await supabase
    .from("committee_due_payments")
    .select(
      "id, amount, wave_checkout_url, committee_dues(label, phone_registry(full_name))",
    )
    .eq("status", "pending")
    .order("paid_at", { ascending: false });

  const filteredDues = (dues ?? []).filter((d) => {
    const member = unwrapRelation(d.phone_registry);
    if (!query) return true;
    const name = (member?.full_name ?? "").toLowerCase();
    return name.includes(query) || d.label.toLowerCase().includes(query);
  });

  return (
    <DashboardShell
      title="Comité directeur"
      breadcrumbs={[
        { label: "Administration", href: "/dashboard" },
        { label: "Comité directeur" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        activeTab === "cotisations" && canManage ? (
          <Link
            href="/dashboard/comite?tab=creer"
            className={primaryActionClass}
          >
            Nouvelle cotisation
          </Link>
        ) : (
          <Link href="/dashboard/budget" className={navActionClass}>
            ← Budget
          </Link>
        )
      }
    >
      {!canManage && <FinanceReadOnlyBanner />}

      <InfoBanner>
        Cotisations des membres du comité directeur (hors coachs).
        {canManage && " Les encaissements peuvent être reportés dans le budget actif."}
      </InfoBanner>

      {params.wave === "success" && canManage && (
        <InfoBanner title="Wave">Confirmez l&apos;encaissement dans Cotisations.</InfoBanner>
      )}

      <Suspense fallback={<div className="h-10" />}>
        <ComiteTabs
          activeTab={activeTab}
          canManage={canManage}
          cotisationsCount={filteredDues.length}
          membresCount={members?.length ?? 0}
          pendingWaveCount={pendingWave?.length ?? 0}
        />
      </Suspense>

      {activeTab === "creer" && canManage ? (
        <div className="space-y-6">
          <BulkDueForm />
          <SingleDueForm
            members={(members ?? []).map((m) => ({
              phone: m.phone_normalized,
              label: `${m.full_name ?? "—"} — ${formatRole(m.role, m.position_title)}`,
            }))}
          />
        </div>
      ) : null}

      {activeTab === "membres" ? (
        <ClubSection title="Membres du comité">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(members ?? []).map((m) => (
              <div
                key={m.phone_normalized}
                className="rounded-xl border border-green-200 bg-white p-3 text-sm"
              >
                <p className="font-medium text-green-900">{m.full_name}</p>
                <p className="text-green-700">
                  {formatRole(m.role, m.position_title)}
                </p>
              </div>
            ))}
          </div>
        </ClubSection>
      ) : null}

      {activeTab === "cotisations" ? (
        <>
          {canManage && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">
                Paiements Wave en attente
              </h2>
              {!pendingWave?.length ? (
                <EmptyState message="Aucun paiement Wave en attente." />
              ) : (
                <div className="space-y-3">
                  {pendingWave.map((p) => {
                    const due = unwrapRelation(p.committee_dues) as {
                      label?: string;
                      phone_registry?: { full_name?: string } | null;
                    } | null;
                    const member = due?.phone_registry;
                    return (
                      <article
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <div>
                          <p className="font-medium text-green-900">
                            {formatFcfa(Number(p.amount))} ·{" "}
                            {member?.full_name ?? "Membre"}
                          </p>
                          <p className="text-sm text-slate-600">{due?.label}</p>
                          {p.wave_checkout_url && (
                            <a
                              href={p.wave_checkout_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-green-800 underline"
                            >
                              Lien Wave
                            </a>
                          )}
                        </div>
                        <form action={confirmCommitteePayment}>
                          <input type="hidden" name="payment_id" value={p.id} />
                          <button
                            type="submit"
                            className="rounded-full bg-green-800 px-5 py-2 text-sm text-white"
                          >
                            Confirmer
                          </button>
                        </form>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          <ClubSection title="Cotisations">
            <LiveSearch
              placeholder="Rechercher membre ou libellé…"
              preserveParams={["tab"]}
            />
            <div className="mt-4 space-y-4">
              {!filteredDues.length ? (
                <EmptyState message="Aucune cotisation comité.">
                  {canManage && (
                    <Link
                      href="/dashboard/comite?tab=creer"
                      className={primaryActionClass}
                    >
                      Créer une cotisation
                    </Link>
                  )}
                </EmptyState>
              ) : (
                filteredDues.map((d) => {
                  const member = unwrapRelation(d.phone_registry);
                  const remaining = Number(d.amount_due) - Number(d.amount_paid);
                  return (
                    <article
                      key={d.id}
                      className="rounded-2xl border border-green-200 bg-white p-4 text-sm"
                    >
                      <p className="font-medium text-green-900">
                        {member?.full_name ?? "—"} · {d.label}
                      </p>
                      <p className="text-green-700">
                        {formatFcfa(Number(d.amount_paid))} /{" "}
                        {formatFcfa(Number(d.amount_due))}
                        {" · "}
                        <DueStatusBadge status={d.status} />
                      </p>
                      {canManage && remaining > 0 && (
                        <CommitteePaymentForm dueId={d.id} remaining={remaining} />
                      )}
                      {canManage && (
                        <DueManageActions
                          dueId={d.id}
                          label={d.label}
                          amountDue={Number(d.amount_due)}
                          dueDate={d.due_date}
                          amountPaid={Number(d.amount_paid)}
                          status={d.status}
                          canManage={canManage}
                          updateAction={updateCommitteeDue}
                          cancelAction={cancelCommitteeDue}
                        />
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </ClubSection>
        </>
      ) : null}
    </DashboardShell>
  );
}
