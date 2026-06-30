"use client";

import { useActionState } from "react";
import { createProfitSharing, type ClubFormState } from "@/app/dashboard/club/actions";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import { formatFcfa } from "@/lib/payments/constants";

const initial: ClubFormState = {};

export function ProfitSharingForm() {
  const [state, action, pending] = useActionState(createProfitSharing, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Nouvel intéressement</h3>
      <form action={action} className="mt-4 space-y-3">
        <select name="team" required className={inputClass}>
          {PLAYER_GROUPS.map((g) => (
            <option key={g.team} value={g.team}>{g.label}</option>
          ))}
        </select>
        <input name="label" required placeholder="Ex. Cagnotte tournoi Pâques" className={inputClass} />
        <input name="total_amount" type="number" min={100} required placeholder="Montant total FCFA" className={inputClass} />
        <ClubFormMessages error={state.error} success={state.success} />
        <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
          Calculer répartition
        </button>
      </form>
    </ClubCard>
  );
}

export function PoolList({
  pools,
}: {
  pools: Array<{
    id: string;
    team: string;
    label: string;
    total_amount: number;
    per_player_amount: number;
    status: string;
  }>;
}) {
  return (
    <div className="space-y-2">
      {pools.map((p) => (
        <article key={p.id} className="rounded-xl border border-green-200 bg-white p-4 text-sm">
          <p className="font-medium text-green-900">{p.label} · {p.team}</p>
          <p className="text-green-700">
            Total {formatFcfa(Number(p.total_amount))} · {formatFcfa(Number(p.per_player_amount))}/joueur · {p.status}
          </p>
        </article>
      ))}
    </div>
  );
}
