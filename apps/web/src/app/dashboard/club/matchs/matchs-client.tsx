"use client";

import { useActionState } from "react";
import { createMatchWithBonuses, type ClubFormState } from "@/app/dashboard/club/actions";
import { BONUS_AMOUNTS } from "@/lib/club-modules/constants";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import { formatFcfa } from "@/lib/payments/constants";

const initial: ClubFormState = {};

export function MatchForm() {
  const [state, action, pending] = useActionState(createMatchWithBonuses, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Enregistrer un match & primes</h3>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <select name="team" required className={inputClass}>
          {PLAYER_GROUPS.map((g) => (
            <option key={g.team} value={g.team}>{g.label}</option>
          ))}
        </select>
        <input name="title" required placeholder="Ex. J3 championnat" className={inputClass} />
        <input name="opponent" placeholder="Adversaire" className={inputClass} />
        <input name="match_date" type="datetime-local" required className={inputClass} />
        <input name="score_home" type="number" min={0} placeholder="Score dom." className={inputClass} />
        <input name="score_away" type="number" min={0} placeholder="Score ext." className={inputClass} />
        <select name="bonus_amount" required className={inputClass}>
          {BONUS_AMOUNTS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-green-800">
          <input type="checkbox" name="is_victory" defaultChecked /> Victoire (distribuer primes)
        </label>
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

export function MatchList({
  matches,
}: {
  matches: Array<{
    id: string;
    team: string;
    title: string;
    opponent: string | null;
    match_date: string;
    bonus_amount: number;
    is_victory: boolean;
  }>;
}) {
  return (
    <div className="space-y-2">
      {matches.map((m) => (
        <article key={m.id} className="rounded-xl border border-green-200 bg-white p-4 text-sm">
          <p className="font-medium text-green-900">{m.title} · {m.team}</p>
          <p className="text-green-700">
            {m.opponent ?? "—"} · {new Intl.DateTimeFormat("fr-CI").format(new Date(m.match_date))}
            {m.is_victory ? ` · Prime ${formatFcfa(Number(m.bonus_amount))}/joueur` : " · Défaite/nul"}
          </p>
        </article>
      ))}
    </div>
  );
}
