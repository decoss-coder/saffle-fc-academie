"use client";

import { useActionState } from "react";
import {
  createBulkCommitteeDue,
  createCommitteeDue,
  recordCommitteePayment,
  type ComiteFormState,
} from "./actions";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { DUE_STATUS_LABELS, formatFcfa, PAYMENT_METHOD_LABELS } from "@/lib/payments/constants";

const initial: ComiteFormState = {};

export function BulkDueForm() {
  const [state, action, pending] = useActionState(createBulkCommitteeDue, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Cotisation groupée — tout le comité</h3>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="label" required placeholder="Ex. Cotisation annuelle 2025-2026" className={`sm:col-span-2 ${inputClass}`} />
        <input name="amount_due" type="number" min={100} required placeholder="Montant FCFA" className={inputClass} />
        <input name="due_date" type="date" className={inputClass} />
        <div className="sm:col-span-2">
          <ClubFormMessages error={state.error} success={state.success} />
          <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
            Créer pour tous les membres
          </button>
        </div>
      </form>
    </ClubCard>
  );
}

export function SingleDueForm({
  members,
}: {
  members: { phone: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(createCommitteeDue, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Cotisation individuelle</h3>
      <form action={action} className="mt-4 space-y-3">
        <select name="member_phone" required className={inputClass}>
          <option value="">Membre du comité</option>
          {members.map((m) => (
            <option key={m.phone} value={m.phone}>{m.label}</option>
          ))}
        </select>
        <input name="label" required placeholder="Libellé" className={inputClass} />
        <input name="amount_due" type="number" min={100} required placeholder="Montant FCFA" className={inputClass} />
        <input name="due_date" type="date" className={inputClass} />
        <ClubFormMessages error={state.error} success={state.success} />
        <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
          Créer
        </button>
      </form>
    </ClubCard>
  );
}

export function PaymentForm({ dueId, label, remaining }: { dueId: string; label: string; remaining: number }) {
  const [state, action, pending] = useActionState(recordCommitteePayment, initial);

  return (
    <form action={action} className="mt-2 flex flex-wrap items-end gap-2 border-t border-green-100 pt-2">
      <input type="hidden" name="committee_due_id" value={dueId} />
      <input name="amount" type="number" min={100} max={remaining} required placeholder="Montant" className="w-28 rounded-lg border border-green-200 px-2 py-1 text-sm" />
      <select name="payment_method" className="rounded-lg border border-green-200 px-2 py-1 text-sm">
        {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-xs text-green-700">
        <input type="checkbox" name="link_budget" defaultChecked />
        Lier au budget actif
      </label>
      <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-3 py-1 text-xs text-white">
        Encaisser
      </button>
      {state.success && <span className="text-xs text-green-700">{state.success}</span>}
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

export function DueStatus({ status }: { status: string }) {
  return <span>{DUE_STATUS_LABELS[status] ?? status}</span>;
}

export { formatFcfa };
