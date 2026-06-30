"use client";

import { useActionState } from "react";
import { createSalaryLine, type SalaryFormState } from "./actions";
import { ClubFormMessages, inputClass } from "@/components/club-ui";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments/constants";
import { markSalaryPaid, cancelSalaryLine } from "./actions";

const initial: SalaryFormState = {};

export function SalaryLineForm({
  coaches,
}: {
  coaches: { phone: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(createSalaryLine, initial);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-green-900">Nouvelle indemnité mensuelle</h2>
      <select name="beneficiary_phone" required className={inputClass}>
        <option value="">Coach</option>
        {coaches.map((c) => (
          <option key={c.phone} value={c.phone}>{c.label}</option>
        ))}
      </select>
      <input name="period_month" type="month" required className={inputClass} />
      <input name="amount" type="number" min={1} required placeholder="Montant FCFA" className={inputClass} />
      <input name="label" placeholder="Libellé (optionnel)" className={inputClass} />
      <ClubFormMessages error={state.error} success={state.success} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-800 px-5 py-2 text-sm text-white disabled:opacity-60"
      >
        Créer
      </button>
    </form>
  );
}

export function MarkPaidForm({ lineId }: { lineId: string }) {
  const [state, action, pending] = useActionState(markSalaryPaid, initial);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="line_id" value={lineId} />
      <select name="payment_method" className="rounded-lg border border-green-200 px-2 py-1 text-sm">
        {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <input name="notes" placeholder="Notes" className="rounded-lg border border-green-200 px-2 py-1 text-sm" />
      <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-3 py-1 text-xs text-white">
        Marquer payé
      </button>
      <ClubFormMessages error={state.error} success={state.success} />
    </form>
  );
}

export function CancelSalaryForm({ lineId }: { lineId: string }) {
  const [state, action, pending] = useActionState(cancelSalaryLine, initial);

  return (
    <form action={action}>
      <input type="hidden" name="line_id" value={lineId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-600 underline disabled:opacity-60"
      >
        Annuler
      </button>
      {state.error && <span className="ml-2 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
