import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRole } from "@/lib/roles";
import { normalizePhone } from "@/lib/phone";
import { formatCategory } from "@/lib/players/constants";
import {
  formatFcfa,
  PAYMENT_STATUS_LABELS,
  paymentStatusVariant,
} from "@/lib/payments/constants";
import {
  formatDateTime,
  formatEventType,
  RESPONSE_STATUS_LABELS,
} from "@/lib/convocations/constants";
import { unwrapRelation } from "@/lib/supabase/relation";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { StatusBadge } from "@/components/status-badge";
import { PhoneDisplay } from "@/components/phone-display";
import { ParentAccessCard } from "@/components/parent-access-card";
import { PlayerAvatar } from "@/components/player-avatar";
import { ClickableCard } from "@/components/clickable-card";
import { PlayerDocumentsList } from "@/components/player-documents-list";
import { DueStatusBadge } from "@/components/due-status-badge";
import { matriculeClass, rowCompact } from "@/lib/dashboard-ui";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { ReceiptLink } from "@/app/dashboard/paiements/payment-history-client";
import { fetchParentDetail } from "@/lib/parents/directory";
import { ParentDetailTabs } from "../parent-detail-tabs";

const DETAIL_TABS = [
  "enfants",
  "paiements",
  "convocations",
  "documents",
  "acces",
] as const;

type DetailTab = (typeof DETAIL_TABS)[number];

function resolveDetailTab(tab?: string): DetailTab {
  if (tab && DETAIL_TABS.includes(tab as DetailTab)) {
    return tab as DetailTab;
  }
  return "enfants";
}

export default async function AdminParentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { key } = await params;
  const { tab } = await searchParams;
  const activeTab = resolveDetailTab(tab);

  const { user, profile } = await requireStaff();
  const supabase = await createClient();

  let parent;
  try {
    parent = await fetchParentDetail(supabase, key);
  } catch {
    notFound();
  }

  if (!parent) notFound();

  const playerIds = parent.children.map((child) => child.id);
  const normalizedPhone =
    parent.phone && !parent.phone.startsWith("staff-")
      ? normalizePhone(parent.phone)
      : null;

  const [
    { data: dues },
    { data: payments },
    { data: convocationEntries },
    { data: documents },
    { data: registry },
  ] = await Promise.all([
    playerIds.length
      ? supabase
          .from("player_dues")
          .select(
            `
            id, label, remaining_amount, status, due_date,
            players ( first_name, last_name, matricule )
          `,
          )
          .in("player_id", playerIds)
          .in("status", ["pending", "partial", "overdue"])
          .order("due_date", { ascending: true })
      : Promise.resolve({ data: [] }),
    playerIds.length
      ? supabase
          .from("payments")
          .select(
            "id, amount, status, created_at, receipt_number, player_id",
          )
          .in("player_id", playerIds)
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),
    playerIds.length
      ? supabase
          .from("convocation_entries")
          .select(
            `
            id, response, response_comment,
            players ( id, first_name, last_name, matricule ),
            convocations ( id, title, event_type, event_date, location, notes )
          `,
          )
          .in("player_id", playerIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    playerIds.length
      ? supabase
          .from("player_documents")
          .select(
            "id, player_id, document_type, file_name, file_path, file_size, status, admin_note, created_at, reviewed_at",
          )
          .in("player_id", playerIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    normalizedPhone
      ? supabase
          .from("phone_registry")
          .select("phone_normalized, role, full_name, linked_user_id")
          .eq("phone_normalized", normalizedPhone)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const documentsWithPlayer = (documents ?? []).map((doc) => {
    const child = parent.children.find((c) => c.id === doc.player_id);
    return {
      ...doc,
      player_name: child
        ? `${child.last_name} ${child.first_name}`
        : undefined,
      player_matricule: child?.matricule,
    };
  });

  const sortedConvocations = [...(convocationEntries ?? [])].sort((a, b) => {
    const dateA = unwrapRelation(a.convocations)?.event_date ?? "";
    const dateB = unwrapRelation(b.convocations)?.event_date ?? "";
    return dateB.localeCompare(dateA);
  });

  const firstChild = parent.children[0];
  const accessPhone =
    normalizedPhone ??
    (firstChild?.phone ? normalizePhone(firstChild.phone) : null);

  return (
    <DashboardShell
      title={parent.displayName}
      subtitle="Fiche parent — consultation complète."
      breadcrumbs={[
        { label: "Club", href: "/dashboard/joueurs" },
        { label: "Parents", href: "/dashboard/parents" },
        { label: parent.displayName },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <div className="flex flex-wrap items-start gap-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-green-950">
              {parent.displayName}
            </h2>
            {parent.activated ? (
              <StatusBadge label="Compte activé" variant="good" />
            ) : (
              <StatusBadge label="En attente" variant="warn" />
            )}
            {parent.isStaffGuardian && parent.accountRole ? (
              <StatusBadge
                label={`${formatRole(parent.accountRole)} · parent`}
                variant="neutral"
              />
            ) : null}
          </div>
          {accessPhone ? (
            <PhoneDisplay phone={accessPhone} className="text-base" />
          ) : (
            <p className="text-sm text-green-700">Aucun numéro renseigné</p>
          )}
          <p className="text-sm text-green-700">
            {parent.children.length} enfant
            {parent.children.length > 1 ? "s" : ""} lié
            {parent.children.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <ParentDetailTabs parentKey={key} activeTab={activeTab} />
      </Suspense>

      {activeTab === "enfants" && (
        <>
          {!parent.children.length ? (
            <EmptyState message="Aucun enfant lié à ce parent.">
              <p className="text-sm text-green-700">
                Vérifiez le numéro sur les fiches joueurs ou l&apos;accès parent
                depuis un joueur.
              </p>
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {parent.children.map((child) => (
                <ClickableCard
                  key={child.id}
                  href={`/dashboard/joueurs/${child.id}`}
                >
                  <div className="flex items-start gap-4">
                    <PlayerAvatar
                      firstName={child.first_name}
                      lastName={child.last_name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={matriculeClass}>{child.matricule}</p>
                      <h3 className="mt-1 text-lg font-semibold text-green-900">
                        {child.last_name} {child.first_name}
                      </h3>
                      <p className="mt-2 text-sm text-green-700">
                        {formatCategory(child.category)}
                        {child.team ? ` · ${child.team}` : ""}
                      </p>
                      {child.guardian_name ? (
                        <p className="mt-1 text-xs text-green-600">
                          Tuteur : {child.guardian_name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </ClickableCard>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "paiements" && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-green-900">
              Cotisations en cours
            </h2>
            {!dues?.length ? (
              <EmptyState message="Aucune cotisation en attente." />
            ) : (
              dues.map((due) => {
                const child = unwrapRelation(due.players);
                return (
                  <article
                    key={due.id}
                    className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm text-green-700">
                      {child
                        ? `${child.last_name} ${child.first_name} · ${child.matricule}`
                        : "Joueur"}
                    </p>
                    <h3 className="mt-1 font-semibold text-green-900">
                      {due.label}
                    </h3>
                    <p className="mt-2 text-sm text-green-700">
                      Reste :{" "}
                      <strong>{formatFcfa(Number(due.remaining_amount))}</strong>
                      {" · "}
                      <DueStatusBadge status={due.status} />
                    </p>
                  </article>
                );
              })
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-green-900">
              Historique des paiements
            </h2>
            {!payments?.length ? (
              <EmptyState message="Aucun paiement enregistré." />
            ) : (
              <DataTable
                count={
                  <ListCount
                    count={payments.length}
                    label="paiement"
                    labelPlural="paiements"
                  />
                }
              >
                <DataTableHead>
                  <tr>
                    <DataTableTh>Date</DataTableTh>
                    <DataTableTh>Joueur</DataTableTh>
                    <DataTableTh>Montant</DataTableTh>
                    <DataTableTh>Statut</DataTableTh>
                    <DataTableTh>Reçu</DataTableTh>
                  </tr>
                </DataTableHead>
                <DataTableBody>
                  {payments.map((payment) => {
                    const child = parent.children.find(
                      (c) => c.id === payment.player_id,
                    );
                    return (
                      <tr key={payment.id}>
                        <td className={rowCompact}>
                          {new Date(payment.created_at).toLocaleDateString(
                            "fr-CI",
                          )}
                        </td>
                        <td className={rowCompact}>
                          {child
                            ? `${child.last_name} ${child.first_name}`
                            : "—"}
                        </td>
                        <td className={rowCompact}>
                          {formatFcfa(Number(payment.amount))}
                        </td>
                        <td className={rowCompact}>
                          <StatusBadge
                            label={
                              PAYMENT_STATUS_LABELS[payment.status] ??
                              payment.status
                            }
                            variant={paymentStatusVariant(payment.status)}
                          />
                        </td>
                        <td className={rowCompact}>
                          <ReceiptLink
                            paymentId={payment.id}
                            receiptNumber={payment.receipt_number}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            )}
          </section>
        </div>
      )}

      {activeTab === "convocations" && (
        <>
          {!sortedConvocations.length ? (
            <EmptyState message="Aucune convocation pour ces enfants." />
          ) : (
            <div className="space-y-4">
              {sortedConvocations.map((entry) => {
                const conv = unwrapRelation(entry.convocations);
                const child = unwrapRelation(entry.players);
                if (!conv || !child) return null;

                return (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-green-700">
                          {formatEventType(conv.event_type)} · {child.last_name}{" "}
                          {child.first_name}
                        </p>
                        <h3 className="text-lg font-semibold text-green-900">
                          {conv.title}
                        </h3>
                        <p className="mt-1 text-sm text-green-700">
                          {formatDateTime(conv.event_date)}
                          {conv.location ? ` · ${conv.location}` : ""}
                        </p>
                      </div>
                      <StatusBadge
                        label={
                          RESPONSE_STATUS_LABELS[entry.response] ??
                          entry.response
                        }
                        variant={
                          entry.response === "pending" ? "warn" : "good"
                        }
                      />
                    </div>
                    {conv.notes ? (
                      <p className="mt-3 text-sm text-green-800">{conv.notes}</p>
                    ) : null}
                    {entry.response_comment ? (
                      <p className="mt-2 text-sm italic text-green-700">
                        Commentaire : {entry.response_comment}
                      </p>
                    ) : null}
                    <Link
                      href={`/dashboard/convocations/${conv.id}`}
                      className="mt-3 inline-block text-sm font-medium text-green-800 underline"
                    >
                      Voir la convocation staff →
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "documents" && (
        <>
          {!playerIds.length ? (
            <EmptyState message="Aucun enfant lié — pas de documents à afficher." />
          ) : (
            <PlayerDocumentsList
              documents={documentsWithPlayer}
              canReview
              showPlayerLink
            />
          )}
        </>
      )}

      {activeTab === "acces" && (
        <>
          {accessPhone && firstChild ? (
            <ParentAccessCard
              playerName={`${firstChild.last_name} ${firstChild.first_name}`}
              phone={accessPhone}
              activated={parent.activated}
              guardianName={parent.displayName}
              linkMode={
                parent.isStaffGuardian
                  ? parent.activated
                    ? "staff_guardian"
                    : "staff_pending"
                  : "parent"
              }
              registryRole={
                registry?.role ?? parent.registryRole ?? parent.accountRole
              }
            />
          ) : (
            <InfoBanner title="Activation impossible">
              <p>
                Aucun numéro de téléphone parent n&apos;est renseigné. Ajoutez
                un numéro sur la fiche joueur, puis revenez ici.
              </p>
              {firstChild ? (
                <Link
                  href={`/dashboard/joueurs/${firstChild.id}?tab=acces`}
                  className="mt-2 inline-block text-sm font-medium text-green-800 underline"
                >
                  Ouvrir l&apos;accès parent sur la fiche joueur →
                </Link>
              ) : null}
            </InfoBanner>
          )}
        </>
      )}
    </DashboardShell>
  );
}
