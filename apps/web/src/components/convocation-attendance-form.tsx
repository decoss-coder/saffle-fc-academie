"use client";

import { useActionState } from "react";
import { updateConvocationAttendance } from "@/app/dashboard/convocations/actions";
import { RESPONSE_STATUS_LABELS } from "@/lib/convocations/constants";
import type { ConvocationFormState } from "@/app/dashboard/convocations/actions";

const initialState: ConvocationFormState = {};

type AttendanceEntry = {
  id: string;
  response: string;
  playerName: string;
};

type ConvocationAttendanceFormProps = {
  convocationId: string;
  isTraining: boolean;
  entries: AttendanceEntry[];
};

const coachOptions = [
  { value: "confirmed", label: "Présent" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Retard" },
  { value: "declined", label: "Décliné" },
  { value: "pending", label: "Non renseigné" },
];

export function ConvocationAttendanceForm({
  convocationId,
  isTraining,
  entries,
}: ConvocationAttendanceFormProps) {
  const [state, formAction, pending] = useActionState(
    updateConvocationAttendance,
    initialState,
  );

  if (!isTraining) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-green-900">
        Présences à l&apos;entraînement
      </h2>
      <p className="mt-1 text-sm text-green-700">
        Indiquez la présence réelle de chaque joueur après la séance.
      </p>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="convocation_id" value={convocationId} />

        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-2 rounded-xl border border-green-100 bg-green-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-green-900">{entry.playerName}</p>
              <p className="text-xs text-green-600">
                Actuel : {RESPONSE_STATUS_LABELS[entry.response] ?? entry.response}
              </p>
            </div>
            <select
              name={`response_${entry.id}`}
              defaultValue={entry.response}
              className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm text-green-950"
            >
              {coachOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {state.error && (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        {state.success && (
          <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
            {state.success}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer les présences"}
        </button>
      </form>
    </section>
  );
}
