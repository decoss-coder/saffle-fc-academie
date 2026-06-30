"use client";

import { useActionState } from "react";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import type { PaymentFormState } from "@/app/dashboard/paiements/actions";

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type CreateGroupDueFormProps = {
  groupCounts: Record<string, number>;
  action: (
    prev: PaymentFormState,
    formData: FormData,
  ) => Promise<PaymentFormState>;
};

const initialState: PaymentFormState = {};

export function CreateGroupDueForm({
  groupCounts,
  action,
}: CreateGroupDueFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-medium text-green-900">
          Nouvelle cotisation par catégorie
        </h2>
        <p className="mt-1 text-sm text-green-700">
          La cotisation sera créée pour tous les joueurs du groupe sélectionné.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-green-800">
            Catégorie / groupe
          </label>
          <select name="team_group" required className={inputClass} defaultValue="">
            <option value="">Choisir un groupe</option>
            {PLAYER_GROUPS.map((group) => (
              <option key={group.team} value={group.team}>
                {group.label} ({groupCounts[group.team] ?? 0} joueur
                {(groupCounts[group.team] ?? 0) > 1 ? "s" : ""})
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-green-800">Libellé</label>
          <input
            name="label"
            required
            placeholder="Ex. Cotisation trimestre 1"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-green-800">
            Montant (FCFA)
          </label>
          <input
            name="amount_due"
            type="number"
            min={100}
            step={1}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-green-800">Échéance</label>
          <input name="due_date" type="date" className={inputClass} />
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Création..." : "Créer pour toute la catégorie"}
      </button>
    </form>
  );
}
