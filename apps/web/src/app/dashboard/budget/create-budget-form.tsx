"use client";

import { useActionState } from "react";
import { createBudget, type BudgetFormState } from "./actions";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";

const initial: BudgetFormState = {};

export function CreateBudgetForm({
  seasons,
}: {
  seasons: { id: string; name: string; is_active: boolean }[];
}) {
  const [state, action, pending] = useActionState(createBudget, initial);
  const active = seasons.find((s) => s.is_active);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Nouveau budget prévisionnel</h3>
      <p className="mt-1 text-sm text-green-700">
        À voter et arrêter avant septembre (SG + Président + TG).
      </p>
      <form action={action} className="mt-4 space-y-3">
        <select name="season_id" required defaultValue={active?.id} className={inputClass}>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}{s.is_active ? " (active)" : ""}
            </option>
          ))}
        </select>
        <input name="title" required placeholder="Ex. Budget prévisionnel 2025-2026" className={inputClass} />
        <textarea name="notes" rows={2} placeholder="Notes (optionnel)" className={inputClass} />
        <ClubFormMessages error={state.error} success={state.success} />
        <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
          Créer le brouillon
        </button>
      </form>
    </ClubCard>
  );
}
