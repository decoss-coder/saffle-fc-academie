"use client";

import { useActionState, useState } from "react";
import type { PaymentFormState } from "@/app/dashboard/paiements/actions";
import {
  FieldError,
  RequiredLabel,
  fieldErrorClass,
  validateRequired,
} from "@/components/form-field";

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type PlayerOption = { id: string; label: string };

type CreateIndividualDueFormProps = {
  players: PlayerOption[];
  action: (
    prev: PaymentFormState,
    formData: FormData,
  ) => Promise<PaymentFormState>;
};

const initialState: PaymentFormState = {};

export function CreateIndividualDueForm({
  players,
  action,
}: CreateIndividualDueFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [playerError, setPlayerError] = useState<string | undefined>();
  const [labelError, setLabelError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-medium text-green-900">
          Cotisation individuelle
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Créer une cotisation pour un joueur précis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <RequiredLabel htmlFor="player_id">Joueur</RequiredLabel>
          <select
            id="player_id"
            name="player_id"
            required
            className={`${inputClass} ${fieldErrorClass(!!playerError)}`}
            defaultValue=""
            onBlur={(e) =>
              setPlayerError(
                e.target.value ? undefined : "Choisissez un joueur.",
              )
            }
          >
            <option value="">Choisir un joueur</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <FieldError message={playerError} />
        </div>
        <div className="sm:col-span-2">
          <RequiredLabel htmlFor="ind-label">Libellé</RequiredLabel>
          <input
            id="ind-label"
            name="label"
            required
            placeholder="Ex. Régularisation trimestre 1"
            className={`${inputClass} ${fieldErrorClass(!!labelError)}`}
            onBlur={(e) => setLabelError(validateRequired(e.target.value))}
          />
          <FieldError message={labelError} />
        </div>
        <div>
          <RequiredLabel htmlFor="ind-amount">Montant (FCFA)</RequiredLabel>
          <input
            id="ind-amount"
            name="amount_due"
            type="number"
            min={100}
            required
            className={`${inputClass} ${fieldErrorClass(!!amountError)}`}
            onBlur={(e) => {
              const v = e.target.value;
              setAmountError(
                !v || Number(v) < 100
                  ? "Montant minimum : 100 FCFA."
                  : undefined,
              );
            }}
          />
          <FieldError message={amountError} />
        </div>
        <div>
          <label htmlFor="ind-date" className="mb-1 block text-sm text-green-800">
            Échéance
          </label>
          <input id="ind-date" name="due_date" type="date" className={inputClass} />
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
        {pending ? "Création..." : "Créer la cotisation"}
      </button>
    </form>
  );
}
