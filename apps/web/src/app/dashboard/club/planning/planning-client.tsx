"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveTrainingSchedule,
  updateTrainingTarget,
  type ClubFormState,
} from "@/app/dashboard/club/actions";
import { DAYS_OF_WEEK, formatDay, hoursBetween } from "@/lib/club-modules/constants";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { PLAYER_GROUPS } from "@/lib/players/constants";

const initial: ClubFormState = {};

export function PlanningForms({
  team,
  targets,
}: {
  team: string;
  targets: Record<string, { min_hours_per_week: number; championship_date: string | null }>;
}) {
  const [scheduleState, scheduleAction, schedulePending] = useActionState(
    saveTrainingSchedule,
    initial,
  );
  const [targetState, targetAction, targetPending] = useActionState(
    updateTrainingTarget,
    initial,
  );
  const target = targets[team];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ClubCard>
        <h3 className="font-medium text-green-900">Ajouter un créneau — {team}</h3>
        <form action={scheduleAction} className="mt-4 space-y-3">
          <input type="hidden" name="team" value={team} />
          <select name="day_of_week" required className={inputClass}>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="start_time" type="time" required className={inputClass} />
            <input name="end_time" type="time" required className={inputClass} />
          </div>
          <input name="location" placeholder="Lieu" className={inputClass} />
          <ClubFormMessages error={scheduleState.error} success={scheduleState.success} />
          <button type="submit" disabled={schedulePending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
            Ajouter
          </button>
        </form>
      </ClubCard>
      <ClubCard>
        <h3 className="font-medium text-green-900">Objectifs — {team}</h3>
        <form action={targetAction} className="mt-4 space-y-3">
          <input type="hidden" name="team" value={team} />
          <label className="block text-sm text-green-800">Heures min. / semaine</label>
          <input
            name="min_hours_per_week"
            type="number"
            step="0.5"
            defaultValue={target?.min_hours_per_week ?? 4}
            required
            className={inputClass}
          />
          <label className="block text-sm text-green-800">Date championnat</label>
          <input
            name="championship_date"
            type="date"
            defaultValue={target?.championship_date ?? ""}
            className={inputClass}
          />
          <ClubFormMessages error={targetState.error} success={targetState.success} />
          <button type="submit" disabled={targetPending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
            Enregistrer objectifs
          </button>
        </form>
      </ClubCard>
    </div>
  );
}

export function ScheduleTable({
  schedules,
}: {
  schedules: Array<{
    id: string;
    team: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    location: string | null;
  }>;
}) {
  return (
    <table className="min-w-full text-sm">
      <thead className="bg-green-800 text-green-100">
        <tr>
          <th className="px-4 py-3 text-left">Groupe</th>
          <th className="px-4 py-3 text-left">Jour</th>
          <th className="px-4 py-3 text-left">Horaire</th>
          <th className="px-4 py-3 text-left">Durée</th>
          <th className="px-4 py-3 text-left">Lieu</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-green-100">
        {schedules.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-3">{s.team}</td>
            <td className="px-4 py-3">{formatDay(s.day_of_week)}</td>
            <td className="px-4 py-3">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</td>
            <td className="px-4 py-3">{hoursBetween(s.start_time, s.end_time).toFixed(1)} h</td>
            <td className="px-4 py-3">{s.location ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PlanningTeamTabs({ activeTeam }: { activeTeam: string }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {PLAYER_GROUPS.map((g) => (
        <Link
          key={g.team}
          href={`/dashboard/club/planning?groupe=${encodeURIComponent(g.team)}`}
          className={`rounded-full px-4 py-2 text-sm ${
            activeTeam === g.team ? "bg-green-800 text-white" : "border border-green-300 text-green-800"
          }`}
        >
          {g.team}
        </Link>
      ))}
    </nav>
  );
}
