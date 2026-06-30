"use client";

import { useActionState } from "react";
import { submitWelfareRequest, reviewWelfareRequestForm, type ClubFormState } from "@/app/dashboard/club/actions";
import { ClubCard, ClubFormMessages, inputClass } from "@/components/club-ui";
import { WELFARE_TYPES } from "@/lib/club-modules/constants";

const initial: ClubFormState = {};

export function WelfareForm({
  players,
}: {
  players: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(submitWelfareRequest, initial);

  return (
    <ClubCard>
      <h3 className="font-medium text-green-900">Demande d&apos;aide</h3>
      <form action={action} className="mt-4 space-y-3">
        <select name="player_id" required className={inputClass}>
          <option value="">Joueur concerné</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <select name="request_type" required className={inputClass}>
          {Object.entries(WELFARE_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <textarea name="description" required rows={3} placeholder="Description" className={inputClass} />
        <ClubFormMessages error={state.error} success={state.success} />
        <button type="submit" disabled={pending} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white">
          Soumettre
        </button>
      </form>
    </ClubCard>
  );
}

export function WelfareList({
  requests,
  canManage,
}: {
  requests: Array<{
    id: string;
    request_type: string;
    description: string;
    status: string;
    created_at: string;
    players: { first_name: string; last_name: string } | null;
  }>;
  canManage: boolean;
}) {
  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <article key={r.id} className="rounded-xl border border-green-200 bg-white p-4 text-sm">
          <p className="font-medium text-green-900">
            {r.players ? `${r.players.last_name} ${r.players.first_name}` : "—"} · {r.request_type}
          </p>
          <p className="text-green-700">{r.description}</p>
          <p className="mt-1 text-xs text-green-600">
            {new Intl.DateTimeFormat("fr-CI").format(new Date(r.created_at))} · {r.status}
          </p>
          {canManage && r.status === "pending" && (
            <form action={reviewWelfareRequestForm} className="mt-2 flex gap-2">
              <input type="hidden" name="request_id" value={r.id} />
              <button name="status" value="approved" className="rounded-full bg-green-800 px-3 py-1 text-xs text-white">
                Approuver
              </button>
              <button name="status" value="rejected" className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700">
                Refuser
              </button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
