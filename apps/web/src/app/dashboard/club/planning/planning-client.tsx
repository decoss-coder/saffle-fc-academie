"use client";

import { useActionState } from "react";
import {
  saveTrainingSchedule,
  updateTrainingTarget,
  type ClubFormState,
} from "@/app/dashboard/club/actions";
import { DAYS_OF_WEEK, formatDay, hoursBetween } from "@/lib/club-modules/constants";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { DataTableBody, DataTableHead, DataTableTh } from "@/components/data-table";
import { rowCompact } from "@/lib/dashboard-ui";

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
    <>
      <DataTableHead>
        <tr>
          <DataTableTh>Groupe</DataTableTh>
          <DataTableTh>Jour</DataTableTh>
          <DataTableTh>Horaire</DataTableTh>
          <DataTableTh>Durée</DataTableTh>
          <DataTableTh>Lieu</DataTableTh>
        </tr>
      </DataTableHead>
      <DataTableBody>
        {schedules.map((s) => (
          <tr key={s.id}>
            <td className={rowCompact}>{s.team}</td>
            <td className={rowCompact}>{formatDay(s.day_of_week)}</td>
            <td className={rowCompact}>
              {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
            </td>
            <td className={rowCompact}>
              {hoursBetween(s.start_time, s.end_time).toFixed(1)} h
            </td>
            <td className={rowCompact}>{s.location ?? "—"}</td>
          </tr>
        ))}
      </DataTableBody>
    </>
  );
}
