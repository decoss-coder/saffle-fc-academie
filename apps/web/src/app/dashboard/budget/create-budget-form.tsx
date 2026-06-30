"use client";

import { useActionState, useState } from "react";
import { createBudget, type BudgetFormState } from "./actions";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import {
  FieldError,
  RequiredLabel,
  fieldErrorClass,
  validateRequired,
} from "@/components/form-field";

const initial: BudgetFormState = {};

export function CreateBudgetForm({
  seasons,
}: {
  seasons: { id: string; name: string; is_active: boolean }[];
}) {
  const [state, action, pending] = useActionState(createBudget, initial);
  const active = seasons.find((s) => s.is_active);
  const [titleError, setTitleError] = useState<string | undefined>();

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Nouveau budget prévisionnel</h3>
      <p className="mt-1 text-sm text-slate-600">
        À voter et arrêter avant septembre (SG + Président + TG).
      </p>
      <form action={action} className="mt-4 space-y-3">
        <div>
          <RequiredLabel htmlFor="season_id">Saison</RequiredLabel>
          <select
            id="season_id"
            name="season_id"
            required
            defaultValue={active?.id}
            className={inputClass}
          >
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.is_active ? " (active)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <RequiredLabel htmlFor="budget-title">Titre</RequiredLabel>
          <input
            id="budget-title"
            name="title"
            required
            placeholder="Ex. Budget prévisionnel 2025-2026"
            className={`${inputClass} ${fieldErrorClass(!!titleError)}`}
            onBlur={(e) => setTitleError(validateRequired(e.target.value))}
          />
          <FieldError message={titleError} />
        </div>
        <textarea
          name="notes"
          rows={2}
          placeholder="Notes (optionnel)"
          className={inputClass}
        />
        <ClubFormMessages error={state.error} success={state.success} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green-800 px-5 py-2 text-sm text-white"
        >
          Créer le brouillon
        </button>
      </form>
    </ClubCard>
  );
}
