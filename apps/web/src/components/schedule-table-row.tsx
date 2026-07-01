"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deleteTrainingSchedule,
  updateTrainingSchedule,
  type ClubFormState,
} from "@/app/dashboard/club/actions";
import { DAYS_OF_WEEK, formatDay, hoursBetween } from "@/lib/club-modules/constants";
import { rowCompact } from "@/lib/dashboard-ui";

const inputClass =
  "rounded-lg border border-green-200 px-2 py-1 text-sm text-green-950";

type ScheduleTableRowProps = {
  schedule: {
    id: string;
    team: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    location: string | null;
  };
};

export function ScheduleTableRow({ schedule }: ScheduleTableRowProps) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction, formPending] = useActionState(
    updateTrainingSchedule,
    {} as ClubFormState,
  );

  if (editing) {
    return (
      <tr className="bg-green-50">
        <td colSpan={6} className="px-4 py-3">
          <form action={formAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="schedule_id" value={schedule.id} />
            <select
              name="day_of_week"
              defaultValue={schedule.day_of_week}
              className={inputClass}
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              name="start_time"
              type="time"
              defaultValue={schedule.start_time.slice(0, 5)}
              required
              className={inputClass}
            />
            <input
              name="end_time"
              type="time"
              defaultValue={schedule.end_time.slice(0, 5)}
              required
              className={inputClass}
            />
            <input
              name="location"
              defaultValue={schedule.location ?? ""}
              placeholder="Lieu"
              className={inputClass}
            />
            {state.error && (
              <p className="w-full text-xs text-red-600">{state.error}</p>
            )}
            {state.success && (
              <p className="w-full text-xs text-green-700">{state.success}</p>
            )}
            <button
              type="submit"
              disabled={formPending}
              className="rounded-full bg-green-800 px-3 py-1 text-xs text-white"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-green-300 px-3 py-1 text-xs text-green-800"
            >
              Fermer
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className={rowCompact}>{schedule.team}</td>
      <td className={rowCompact}>{formatDay(schedule.day_of_week)}</td>
      <td className={rowCompact}>
        {schedule.start_time.slice(0, 5)} – {schedule.end_time.slice(0, 5)}
      </td>
      <td className={rowCompact}>
        {hoursBetween(schedule.start_time, schedule.end_time).toFixed(1)} h
      </td>
      <td className={rowCompact}>{schedule.location ?? "—"}</td>
      <td className={rowCompact}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-green-800 underline"
          >
            Modifier
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("Supprimer ce créneau ?")) return;
              startTransition(async () => {
                const result = await deleteTrainingSchedule(schedule.id);
                setMessage(result.success ?? result.error ?? null);
              });
            }}
            className="text-xs font-medium text-red-700 underline disabled:opacity-60"
          >
            Supprimer
          </button>
        </div>
        {message && <p className="mt-1 text-xs text-slate-600">{message}</p>}
      </td>
    </tr>
  );
}
