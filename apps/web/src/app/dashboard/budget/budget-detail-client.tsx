"use client";

import { useActionState } from "react";
import {
  addBudgetLine,
  addBudgetExpense,
  addBudgetReceipt,
  signBudget,
  signOverBudgetExpense,
  submitBudget,
  type BudgetFormState,
} from "./actions";
import {
  BUDGET_LINE_TYPES,
  BUDGET_STATUS_LABELS,
  DEPENSE_CATEGORIES,
  EXPENSE_STATUS_LABELS,
  RECEIPT_TYPES,
  RECETTE_CATEGORIES,
  SIGNOFF_ROLE_LABELS,
} from "@/lib/budget/constants";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments/constants";
import { formatFcfa } from "@/lib/payments/constants";
import { activateBudgetForm } from "./actions";

const initial: BudgetFormState = {};

export function BudgetLineForm({ budgetId, disabled }: { budgetId: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(addBudgetLine, initial);
  if (disabled) return null;

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Ajouter une ligne</h3>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="budget_id" value={budgetId} />
        <select name="line_type" required className={inputClass}>
          {BUDGET_LINE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select name="category" required className={inputClass}>
          <optgroup label="Recettes">
            {RECETTE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </optgroup>
          <optgroup label="Dépenses">
            {DEPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </optgroup>
        </select>
        <input name="label" required placeholder="Libellé" className={`sm:col-span-2 ${inputClass}`} />
        <input name="amount_planned" type="number" min={0} required placeholder="Montant FCFA" className={inputClass} />
        <div className="sm:col-span-2">
          <ClubFormMessages error={state.error} success={state.success} />
          <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
            Ajouter
          </button>
        </div>
      </form>
    </ClubCard>
  );
}

export function SubmitBudgetForm({ budgetId, canSubmit }: { budgetId: string; canSubmit: boolean }) {
  const [state, action, pending] = useActionState(submitBudget, initial);
  if (!canSubmit) return null;

  return (
    <form action={action}>
      <input type="hidden" name="budget_id" value={budgetId} />
      <ClubFormMessages error={state.error} success={state.success} />
      <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
        Soumettre au bureau (SG + Président + TG)
      </button>
    </form>
  );
}

export function SignBudgetPanel({
  budgetId,
  signoffs,
  caps,
  status,
}: {
  budgetId: string;
  signoffs: { signoff_role: string; signed_at: string }[];
  caps: { canSignAsSG: boolean; canSignAsPresident: boolean; canSignAsTG: boolean };
  status: string;
}) {
  const [state, action, pending] = useActionState(signBudget, initial);
  if (status !== "submitted") return null;

  const signed = new Set(signoffs.map((s) => s.signoff_role));
  const roles: { role: string; can: boolean }[] = [
    { role: "secretary_general", can: caps.canSignAsSG },
    { role: "president", can: caps.canSignAsPresident },
    { role: "treasurer", can: caps.canSignAsTG },
  ];

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Validation du budget</h3>
      <ul className="mt-3 space-y-2 text-sm text-green-800">
        {(["secretary_general", "president", "treasurer"] as const).map((r) => (
          <li key={r}>
            {SIGNOFF_ROLE_LABELS[r]} : {signed.has(r) ? "✓ Signé" : "En attente"}
          </li>
        ))}
      </ul>
      <ClubFormMessages error={state.error} success={state.success} />
      <div className="mt-4 flex flex-wrap gap-2">
        {roles.map(({ role, can }) =>
          can && !signed.has(role) ? (
            <form key={role} action={action}>
              <input type="hidden" name="budget_id" value={budgetId} />
              <input type="hidden" name="signoff_role" value={role} />
              <button type="submit" disabled={pending} className="rounded-full border border-green-600 px-4 py-2 text-sm text-green-800">
                Signer — {SIGNOFF_ROLE_LABELS[role]}
              </button>
            </form>
          ) : null,
        )}
      </div>
    </ClubCard>
  );
}

export function ActivateBudgetButton({ budgetId, status }: { budgetId: string; status: string }) {
  if (status !== "approved") return null;
  return (
    <form action={activateBudgetForm}>
      <input type="hidden" name="budget_id" value={budgetId} />
      <button type="submit" className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
        Activer le budget (début d&apos;exécution)
      </button>
    </form>
  );
}

export function ReceiptForm({
  budgetId,
  recetteLines,
}: {
  budgetId: string;
  recetteLines: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(addBudgetReceipt, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Saisir une recette</h3>
      <p className="text-xs text-green-600">Saisie manuelle — non liée aux paiements Wave automatiques.</p>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="budget_id" value={budgetId} />
        <select name="receipt_type" required className={inputClass}>
          {RECEIPT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select name="budget_line_id" className={inputClass}>
          <option value="">Ligne budget (optionnel)</option>
          {recetteLines.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
        <input name="label" required placeholder="Libellé" className={`sm:col-span-2 ${inputClass}`} />
        <input name="amount" type="number" min={100} required placeholder="Montant FCFA" className={inputClass} />
        <input name="received_at" type="date" className={inputClass} />
        <select name="payment_method" className={inputClass}>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <div className="sm:col-span-2">
          <ClubFormMessages error={state.error} success={state.success} />
          <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
            Enregistrer recette
          </button>
        </div>
      </form>
    </ClubCard>
  );
}

export function ExpenseForm({
  budgetId,
  depenseLines,
}: {
  budgetId: string;
  depenseLines: { id: string; label: string; amount_planned: number }[];
}) {
  const [state, action, pending] = useActionState(addBudgetExpense, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Saisir une dépense</h3>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="budget_id" value={budgetId} />
        <select name="budget_line_id" className={inputClass}>
          <option value="">Hors ligne budget (approbation requise)</option>
          {depenseLines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label} ({formatFcfa(Number(l.amount_planned))})
            </option>
          ))}
        </select>
        <input name="label" required placeholder="Libellé" className={inputClass} />
        <input name="amount" type="number" min={100} required placeholder="Montant FCFA" className={inputClass} />
        <input name="expense_date" type="date" className={inputClass} />
        <select name="payment_method" className={inputClass}>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <div className="sm:col-span-2">
          <ClubFormMessages error={state.error} success={state.success} />
          <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
            Enregistrer dépense
          </button>
        </div>
      </form>
    </ClubCard>
  );
}

export function OverBudgetPanel({
  expenses,
  caps,
}: {
  expenses: Array<{
    id: string;
    label: string;
    amount: number;
    over_budget_amount: number;
    status: string;
    signoffs: { signoff_role: string; decision: string }[];
  }>;
  caps: { canSignAsSG: boolean; canSignAsPresident: boolean };
}) {
  const [state, action, pending] = useActionState(signOverBudgetExpense, initial);
  const pendingList = expenses.filter((e) => e.status === "pending_approval");

  if (!pendingList.length) return null;

  return (
    <ClubCard>
      <h3 className="font-medium text-red-900">Dépenses hors budget — approbation SG + Président</h3>
      <ClubFormMessages error={state.error} success={state.success} />
      <div className="mt-4 space-y-4">
        {pendingList.map((e) => {
          const signed = new Set(e.signoffs.filter((s) => s.decision === "approved").map((s) => s.signoff_role));
          return (
            <article key={e.id} className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
              <p className="font-medium">{e.label} — {formatFcfa(Number(e.amount))}</p>
              <p className="text-red-700">Dépassement : {formatFcfa(Number(e.over_budget_amount))}</p>
              <p className="text-xs">{EXPENSE_STATUS_LABELS[e.status]}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {caps.canSignAsSG && !signed.has("secretary_general") && (
                  <form action={action}>
                    <input type="hidden" name="expense_id" value={e.id} />
                    <input type="hidden" name="signoff_role" value="secretary_general" />
                    <input type="hidden" name="decision" value="approved" />
                    <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-3 py-1 text-xs text-white">
                      SG — Approuver
                    </button>
                  </form>
                )}
                {caps.canSignAsPresident && !signed.has("president") && (
                  <form action={action}>
                    <input type="hidden" name="expense_id" value={e.id} />
                    <input type="hidden" name="signoff_role" value="president" />
                    <input type="hidden" name="decision" value="approved" />
                    <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-3 py-1 text-xs text-white">
                      Président — Approuver
                    </button>
                  </form>
                )}
                {(caps.canSignAsSG || caps.canSignAsPresident) && (
                  <form action={action}>
                    <input type="hidden" name="expense_id" value={e.id} />
                    <input type="hidden" name="signoff_role" value={caps.canSignAsPresident ? "president" : "secretary_general"} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button type="submit" disabled={pending} className="rounded-full border border-red-400 px-3 py-1 text-xs text-red-700">
                      Refuser
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </ClubCard>
  );
}

export function BudgetStatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
      {BUDGET_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export { RECETTE_CATEGORIES, DEPENSE_CATEGORIES };
