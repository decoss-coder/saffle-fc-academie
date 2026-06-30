"use client";

import { useActionState } from "react";
import { addDisciplineRecord, type ClubFormState } from "@/app/dashboard/club/actions";
import { DISCIPLINE_STATUS_LABELS } from "@/lib/club-modules/constants";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";

const initial: ClubFormState = {};

export function DisciplineForm({
  players,
}: {
  players: { id: string; label: string; discipline_status: string }[];
}) {
  const [state, action, pending] = useActionState(addDisciplineRecord, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Nouvel enregistrement</h3>
      <form action={action} className="mt-4 space-y-3">
        <select name="player_id" required className={inputClass}>
          <option value="">Joueur</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({DISCIPLINE_STATUS_LABELS[p.discipline_status] ?? p.discipline_status})
            </option>
          ))}
        </select>
        <select name="incident_type" className={inputClass} defaultValue="warning">
          <option value="absence">Absence</option>
          <option value="late">Retard</option>
          <option value="warning">Avertissement</option>
          <option value="suspension">Suspension</option>
          <option value="encouragement">Mot d&apos;encouragement</option>
        </select>
        <textarea name="description" required rows={3} placeholder="Description" className={inputClass} />
        <select name="discipline_status" className={inputClass}>
          <option value="">— Ne pas changer le statut —</option>
          {Object.entries(DISCIPLINE_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <ClubFormMessages error={state.error} success={state.success} />
        <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
          Enregistrer
        </button>
      </form>
    </ClubCard>
  );
}
