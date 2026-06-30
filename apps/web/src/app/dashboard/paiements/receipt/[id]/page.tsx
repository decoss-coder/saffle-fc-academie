import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import {
  formatFcfa,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/payments/constants";
import { unwrapRelation } from "@/lib/supabase/relation";
import { requireFinanceViewer } from "@/lib/permissions";
import { PrintReceiptButton } from "../../print-receipt-button";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireFinanceViewer();
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select(
      `
      id, amount, status, payment_method, receipt_number, paid_at, created_at, payer_name,
      players ( first_name, last_name, matricule ),
      player_dues ( label )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!payment || payment.status !== "completed" || !payment.receipt_number) {
    notFound();
  }

  const player = unwrapRelation(payment.players);
  const due = unwrapRelation(payment.player_dues);
  const paidAt = payment.paid_at ?? payment.created_at;

  return (
    <DashboardShell
      title="Reçu de paiement"
      breadcrumbs={[
        { label: "Finance", href: "/dashboard" },
        { label: "Paiements", href: "/dashboard/paiements" },
        { label: payment.receipt_number },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="text-center">
          <p className="text-lg font-bold text-green-900">{CLUB.name}</p>
          <p className="text-sm text-green-700">{CLUB.city}</p>
          <h1 className="mt-6 text-xl font-semibold text-green-900">Reçu de paiement</h1>
          <p className="mt-1 font-mono text-sm text-slate-600">{payment.receipt_number}</p>
        </div>

        <dl className="mt-8 space-y-3 text-sm">
          <div className="flex justify-between border-b border-green-100 pb-2">
            <dt className="text-slate-600">Date</dt>
            <dd>{new Date(paidAt).toLocaleString("fr-CI")}</dd>
          </div>
          <div className="flex justify-between border-b border-green-100 pb-2">
            <dt className="text-slate-600">Joueur</dt>
            <dd>
              {player
                ? `${player.last_name} ${player.first_name} (${player.matricule})`
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between border-b border-green-100 pb-2">
            <dt className="text-slate-600">Cotisation</dt>
            <dd>{due?.label ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-green-100 pb-2">
            <dt className="text-slate-600">Montant</dt>
            <dd className="font-semibold">{formatFcfa(Number(payment.amount))}</dd>
          </div>
          <div className="flex justify-between border-b border-green-100 pb-2">
            <dt className="text-slate-600">Mode</dt>
            <dd>{PAYMENT_METHOD_LABELS[payment.payment_method]}</dd>
          </div>
          {payment.payer_name && (
            <div className="flex justify-between border-b border-green-100 pb-2">
              <dt className="text-slate-600">Payeur</dt>
              <dd>{payment.payer_name}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-slate-600">Statut</dt>
            <dd>{PAYMENT_STATUS_LABELS[payment.status]}</dd>
          </div>
        </dl>

        <p className="mt-8 text-center text-xs text-slate-500">
          Document généré par {CLUB.shortName} — valable sans signature.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <Link
          href="/dashboard/paiements/historique"
          className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800"
        >
          ← Historique
        </Link>
        <PrintReceiptButton />
      </div>
    </DashboardShell>
  );
}
