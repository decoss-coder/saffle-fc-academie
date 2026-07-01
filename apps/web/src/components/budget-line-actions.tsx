"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deleteBudgetLine,
  updateBudgetLine,
  type BudgetFormState,
} from "@/app/dashboard/budget/actions";
import { formatFcfa } from "@/lib/payments/constants";

const inputClass =
  "rounded-lg border border-green-200 px-2 py-1 text-sm text-green-950";

type BudgetLineActionsProps = {
  lineId: string;
  label: string;
  amountPlanned: number;
  editable: boolean;
};

export function BudgetLineActions({
  lineId,
  label,
  amountPlanned,
  editable,
}: BudgetLineActionsProps) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updatePending] = useActionState(
    updateBudgetLine,
    {} as BudgetFormState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBudgetLine,
    {} as BudgetFormState,
  );
  const [, startTransition] = useTransition();

  if (!editable) {
    return <span className="text-slate-400">—</span>;
  }

  if (editing) {
    return (
      <form action={updateAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="line_id" value={lineId} />
        <input
          name="label"
          required
          defaultValue={label}
          className={`min-w-[120px] ${inputClass}`}
        />
        <input
          name="amount_planned"
          type="number"
          min={0}
          required
          defaultValue={amountPlanned}
          className={`w-28 ${inputClass}`}
        />
        {updateState.error && (
          <span className="text-xs text-red-600">{updateState.error}</span>
        )}
        <button
          type="submit"
          disabled={updatePending}
          className="rounded-full bg-green-800 px-2 py-1 text-xs text-white"
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-green-800 underline"
        >
          Fermer
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-green-800 underline"
      >
        Modifier
      </button>
      <form action={deleteAction} className="inline">
        <input type="hidden" name="line_id" value={lineId} />
        <button
          type="submit"
          disabled={deletePending}
          onClick={(e) => {
            if (!confirm(`Supprimer la ligne « ${label} » (${formatFcfa(amountPlanned)}) ?`)) {
              e.preventDefault();
            }
          }}
          className="text-xs font-medium text-red-700 underline disabled:opacity-60"
        >
          Supprimer
        </button>
      </form>
      {(deleteState.error || deleteState.success) && (
        <span className="block w-full text-xs text-slate-600">
          {deleteState.error ?? deleteState.success}
        </span>
      )}
    </div>
  );
}
