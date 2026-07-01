"use client";

import { useActionState, useState } from "react";

type DueFormState = { error?: string; success?: string };

type DueManageActionsProps = {
  dueId: string;
  label: string;
  amountDue: number;
  dueDate: string | null;
  canManage: boolean;
  amountPaid: number;
  status: string;
  updateAction: (
    prev: DueFormState,
    formData: FormData,
  ) => Promise<DueFormState>;
  cancelAction: (
    prev: DueFormState,
    formData: FormData,
  ) => Promise<DueFormState>;
};

const inputClass =
  "rounded-lg border border-green-200 px-2 py-1 text-sm text-green-950";

export function DueManageActions({
  dueId,
  label,
  amountDue,
  dueDate,
  canManage,
  amountPaid,
  status,
  updateAction,
  cancelAction,
}: DueManageActionsProps) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateAction,
    {},
  );
  const [cancelState, cancelFormAction, cancelPending] = useActionState(
    cancelAction,
    {},
  );

  if (!canManage || status === "cancelled" || status === "paid") {
    return null;
  }

  if (Number(amountPaid) > 0) {
    return null;
  }

  if (editing) {
    return (
      <form
        action={updateFormAction}
        className="mt-2 flex flex-wrap items-end gap-2 border-t border-green-100 pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <input type="hidden" name="due_id" value={dueId} />
        <input
          name="label"
          required
          defaultValue={label}
          placeholder="Libellé"
          className={`min-w-[140px] ${inputClass}`}
        />
        <input
          name="amount_due"
          type="number"
          min={100}
          required
          defaultValue={amountDue}
          placeholder="Montant"
          className={`w-28 ${inputClass}`}
        />
        <input
          name="due_date"
          type="date"
          defaultValue={dueDate ?? ""}
          className={inputClass}
        />
        {updateState.error && (
          <p className="w-full text-xs text-red-600">{updateState.error}</p>
        )}
        {updateState.success && (
          <p className="w-full text-xs text-green-700">{updateState.success}</p>
        )}
        <button
          type="submit"
          disabled={updatePending}
          className="rounded-full bg-green-800 px-3 py-1 text-xs text-white disabled:opacity-60"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-full border border-green-300 px-3 py-1 text-xs text-green-800"
        >
          Annuler
        </button>
      </form>
    );
  }

  return (
    <div
      className="mt-2 flex flex-wrap gap-2 border-t border-green-100 pt-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-green-300 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
      >
        Modifier
      </button>
      <form action={cancelFormAction} className="inline">
        <input type="hidden" name="due_id" value={dueId} />
        <button
          type="submit"
          disabled={cancelPending}
          onClick={(e) => {
            if (!confirm("Annuler cette cotisation ?")) {
              e.preventDefault();
            }
          }}
          className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Annuler la cotisation
        </button>
      </form>
      {cancelState.error && (
        <p className="w-full text-xs text-red-600">{cancelState.error}</p>
      )}
      {cancelState.success && (
        <p className="w-full text-xs text-green-700">{cancelState.success}</p>
      )}
    </div>
  );
}
