"use client";

import { useActionState } from "react";
import type { ConvocationFormState } from "@/app/dashboard/convocations/actions";

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type CreateConvocationFormProps = {
  players: { id: string; label: string; category: string }[];
  action: (
    prev: ConvocationFormState,
    formData: FormData,
  ) => Promise<ConvocationFormState>;
};

const initialState: ConvocationFormState = {};

export function CreateConvocationForm({
  players,
  action,
}: CreateConvocationFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-green-900">Nouvelle convocation</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-green-800">Titre</label>
          <input
            name="title"
            required
            placeholder="Ex. Entraînement U15"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-green-800">Type</label>
          <select name="event_type" className={inputClass}>
            <option value="training">Entraînement</option>
            <option value="match">Match</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-green-800">Lieu</label>
          <input name="location" placeholder="Stade de Sinfra" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-green-800">Date</label>
          <input name="event_date" type="date" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-green-800">Heure</label>
          <input
            name="event_time"
            type="time"
            defaultValue="09:00"
            required
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-green-800">Notes</label>
          <textarea name="notes" rows={2} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm text-green-800">
            Joueurs convoqués
          </label>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-green-200 p-3">
            {players.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 text-sm text-green-800"
              >
                <input type="checkbox" name="player_ids" value={p.id} />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Envoi..." : "Envoyer la convocation"}
      </button>
    </form>
  );
}
