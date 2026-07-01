"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteConvocation,
  updateConvocation,
  type ConvocationFormState,
} from "@/app/dashboard/convocations/actions";

const inputClass =
  "w-full rounded-xl border border-green-200 px-3 py-2 text-sm text-green-950";

type ConvocationAdminPanelProps = {
  convocation: {
    id: string;
    title: string;
    event_date: string;
    location: string | null;
    notes: string | null;
  };
};

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

function toTimeInput(iso: string) {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function ConvocationAdminPanel({ convocation }: ConvocationAdminPanelProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateConvocation,
    {} as ConvocationFormState,
  );
  const [deletePending, startDelete] = useTransition();

  return (
    <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-green-900">Gérer la convocation</h2>
      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="convocation_id" value={convocation.id} />
        <div>
          <label className="mb-1 block text-sm text-green-800">Titre</label>
          <input
            name="title"
            required
            defaultValue={convocation.title}
            className={inputClass}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-green-800">Date</label>
            <input
              name="event_date"
              type="date"
              required
              defaultValue={toDateInput(convocation.event_date)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-green-800">Heure</label>
            <input
              name="event_time"
              type="time"
              required
              defaultValue={toTimeInput(convocation.event_date)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-green-800">Lieu</label>
          <input
            name="location"
            defaultValue={convocation.location ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-green-800">Notes</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={convocation.notes ?? ""}
            className={inputClass}
          />
        </div>
        {state.error && (
          <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
            {state.success}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-green-800 px-5 py-2 text-sm text-white disabled:opacity-60"
          >
            Enregistrer les modifications
          </button>
          <button
            type="button"
            disabled={deletePending}
            onClick={() => {
              if (
                !confirm(
                  "Supprimer définitivement cette convocation et toutes les réponses ?",
                )
              ) {
                return;
              }
              startDelete(async () => {
                const result = await deleteConvocation(convocation.id);
                if (result.error) {
                  alert(result.error);
                  return;
                }
                router.push("/dashboard/convocations");
                router.refresh();
              });
            }}
            className="rounded-full border border-red-300 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Supprimer la convocation
          </button>
        </div>
      </form>
    </div>
  );
}
