"use client";

import { useActionState } from "react";
import { saveMedicalInfo, type ClubFormState } from "@/app/dashboard/club/actions";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";

const initial: ClubFormState = {};

export function MedicalForm({
  players,
}: {
  players: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(saveMedicalInfo, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Assurance & certificat médical</h3>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <select name="player_id" required className={inputClass}>
            <option value="">Joueur</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
        <input name="insurance_provider" placeholder="Assureur" className={inputClass} />
        <input name="insurance_number" placeholder="N° police" className={inputClass} />
        <input name="medical_cert_expires_at" type="date" className={inputClass} />
        <input name="team_doctor_contact" placeholder="Médecin du club" className={inputClass} />
        <div className="sm:col-span-2">
          <ClubFormMessages error={state.error} success={state.success} />
          <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
            Enregistrer
          </button>
        </div>
      </form>
    </ClubCard>
  );
}
