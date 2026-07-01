"use client";

import { useActionState } from "react";
import {
  addInventoryItem,
  loanEquipment,
  savePlayerEquipment,
  type ClubFormState,
} from "@/app/dashboard/club/actions";
import {
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPES,
} from "@/lib/club-modules/constants";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { PLAYER_GROUPS } from "@/lib/players/constants";

const initial: ClubFormState = {};

type PlayerOption = { id: string; label: string; team: string | null };

export function PlayerEquipmentForm({ players }: { players: PlayerOption[] }) {
  const [state, action, pending] = useActionState(savePlayerEquipment, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Fiche équipement joueur</h3>
      <form action={action} className="mt-4 space-y-3">
        <select name="player_id" required className={inputClass}>
          <option value="">Joueur</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {EQUIPMENT_TYPES.map((t) => (
          <div key={t.key}>
            <label className="text-xs text-green-700">{t.label}</label>
            <select name={t.key} className={inputClass} defaultValue="ok">
              {Object.entries(EQUIPMENT_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        ))}
        <input name="shoe_size" placeholder="Pointure" className={inputClass} />
        <label className="flex items-center gap-2 text-sm text-green-800">
          <input type="checkbox" name="shoe_loaned" /> Chaussures prêtées
        </label>
        <ClubFormMessages error={state.error} success={state.success} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green-800 px-5 py-2 text-sm text-white"
        >
          Enregistrer
        </button>
      </form>
    </ClubCard>
  );
}

export function InventoryForm() {
  const [state, action, pending] = useActionState(addInventoryItem, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Inventaire</h3>
      <form action={action} className="mt-4 space-y-3">
        <input
          name="label"
          required
          placeholder="Ex. Paire chaussures #12"
          className={inputClass}
        />
        <input name="size" placeholder="Taille" className={inputClass} />
        <select name="team" className={inputClass}>
          <option value="">Tous groupes</option>
          {PLAYER_GROUPS.map((g) => (
            <option key={g.team} value={g.team}>
              {g.label}
            </option>
          ))}
        </select>
        <input type="hidden" name="item_type" value="shoes" />
        <ClubFormMessages error={state.error} success={state.success} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green-800 px-5 py-2 text-sm text-white"
        >
          Ajouter
        </button>
      </form>
    </ClubCard>
  );
}

export function LoanEquipmentForm({
  players,
  inventory,
}: {
  players: PlayerOption[];
  inventory: { id: string; label: string; size: string | null; status: string }[];
}) {
  const [state, action, pending] = useActionState(loanEquipment, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Prêt matériel</h3>
      <form action={action} className="mt-4 space-y-3">
        <select name="item_id" required className={inputClass}>
          <option value="">Article disponible</option>
          {inventory
            .filter((i) => i.status === "available")
            .map((i) => (
              <option key={i.id} value={i.id}>
                {i.label} {i.size ? `(${i.size})` : ""}
              </option>
            ))}
        </select>
        <select name="player_id" required className={inputClass}>
          <option value="">Joueur</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <input name="due_at" type="date" className={inputClass} />
        <ClubFormMessages error={state.error} success={state.success} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green-800 px-5 py-2 text-sm text-white"
        >
          Enregistrer prêt
        </button>
      </form>
    </ClubCard>
  );
}
