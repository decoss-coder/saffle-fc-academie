"use client";

import { useActionState } from "react";
import { ClubFormMessages } from "@/components/club-ui";
import { FieldError, RequiredLabel, validateRequired } from "@/components/form-field";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments/constants";

export type PaymentFormState = { error?: string; success?: string };

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type PaymentFormProps = {
  action: (
    prev: PaymentFormState,
    formData: FormData,
  ) => Promise<PaymentFormState>;
  dueId: string;
  dueIdFieldName?: string;
  remaining: number;
  showPayerName?: boolean;
  showLinkBudget?: boolean;
  compact?: boolean;
};

export function PaymentForm({
  action,
  dueId,
  dueIdFieldName = "due_id",
  remaining,
  showPayerName = true,
  showLinkBudget = false,
  compact = false,
}: PaymentFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  if (compact) {
    return (
      <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2 border-t border-green-100 pt-2">
        <input type="hidden" name={dueIdFieldName} value={dueId} />
        <input
          name="amount"
          type="number"
          min={100}
          max={remaining}
          required
          placeholder="Montant"
          className="w-28 rounded-lg border border-green-200 px-2 py-1 text-sm"
        />
        <select name="payment_method" className="rounded-lg border border-green-200 px-2 py-1 text-sm">
          {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {showPayerName && (
          <input
            name="payer_name"
            placeholder="Payeur réel"
            className="w-36 rounded-lg border border-green-200 px-2 py-1 text-sm"
          />
        )}
        {showLinkBudget && (
          <label className="flex items-center gap-1 text-xs text-green-700">
            <input type="checkbox" name="link_budget" defaultChecked />
            Lier au budget actif
          </label>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green-800 px-3 py-1 text-xs text-white disabled:opacity-60"
        >
          Encaisser
        </button>
        <ClubFormMessages error={state.error} success={state.success} />
      </form>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-2xl border border-green-200 bg-green-50/50 p-4">
      <input type="hidden" name={dueIdFieldName} value={dueId} />
      <p className="text-sm text-green-800">
        Reste à payer : <strong>{remaining.toLocaleString("fr-CI")} FCFA</strong>
      </p>
      <div>
        <RequiredLabel htmlFor={`amount-${dueId}`}>Montant (FCFA)</RequiredLabel>
        <input
          id={`amount-${dueId}`}
          name="amount"
          type="number"
          min={100}
          max={remaining}
          required
          className={inputClass}
          onBlur={(e) => validateRequired(e.target.value)}
        />
        <FieldError message={undefined} />
      </div>
      <div>
        <RequiredLabel htmlFor={`method-${dueId}`}>Mode de paiement</RequiredLabel>
        <select id={`method-${dueId}`} name="payment_method" required className={inputClass}>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {showPayerName && (
        <div>
          <RequiredLabel htmlFor={`payer-${dueId}`}>Payeur réel</RequiredLabel>
          <input
            id={`payer-${dueId}`}
            name="payer_name"
            placeholder="Nom du payeur"
            className={inputClass}
          />
        </div>
      )}
      <div>
        <label htmlFor={`notes-${dueId}`} className="text-sm text-green-800">
          Observations
        </label>
        <input id={`notes-${dueId}`} name="notes" className={inputClass} />
      </div>
      {showLinkBudget && (
        <label className="flex items-center gap-2 text-sm text-green-800">
          <input type="checkbox" name="link_budget" defaultChecked />
          Lier au budget actif
        </label>
      )}
      <ClubFormMessages error={state.error} success={state.success} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        Enregistrer le paiement
      </button>
    </form>
  );
}
