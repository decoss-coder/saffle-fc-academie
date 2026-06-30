"use client";

import { useActionState } from "react";
import { addLogisticsTask, updateLogisticsStatusForm, type ClubFormState } from "@/app/dashboard/club/actions";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { LOGISTICS_CATEGORIES } from "@/lib/club-modules/constants";

const initial: ClubFormState = {};

export function LogisticsForm() {
  const [state, action, pending] = useActionState(addLogisticsTask, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Nouvelle tâche logistique</h3>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="title" required placeholder="Titre" className={inputClass} />
        <select name="category" required className={inputClass}>
          {Object.entries(LOGISTICS_CATEGORIES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input name="scheduled_for" type="date" className={inputClass} />
        <textarea name="notes" rows={2} placeholder="Notes" className={`sm:col-span-2 ${inputClass}`} />
        <div className="sm:col-span-2">
          <ClubFormMessages error={state.error} success={state.success} />
          <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
            Créer
          </button>
        </div>
      </form>
    </ClubCard>
  );
}

export function LogisticsList({
  tasks,
}: {
  tasks: Array<{
    id: string;
    title: string;
    category: string;
    scheduled_for: string | null;
    status: string;
  }>;
}) {
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <article key={t.id} className="rounded-xl border border-green-200 bg-white p-4 text-sm">
          <p className="font-medium text-green-900">{t.title} · {t.category}</p>
          <p className="text-green-700">
            {t.status}
            {t.scheduled_for ? ` · ${new Intl.DateTimeFormat("fr-CI").format(new Date(t.scheduled_for))}` : ""}
          </p>
          {t.status !== "done" && (
            <form action={updateLogisticsStatusForm} className="mt-2">
              <input type="hidden" name="id" value={t.id} />
              <button name="status" value="done" className="rounded-full bg-green-800 px-3 py-1 text-xs text-white">
                Terminer
              </button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
