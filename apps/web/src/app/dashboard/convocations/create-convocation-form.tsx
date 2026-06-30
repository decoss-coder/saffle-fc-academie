"use client";

import { useActionState, useMemo, useState } from "react";
import type { ConvocationFormState } from "@/app/dashboard/convocations/actions";
import { formatCategory } from "@/lib/players/constants";
import { matriculeClass } from "@/lib/dashboard-ui";
import {
  FieldError,
  RequiredLabel,
  fieldErrorClass,
  validateRequired,
} from "@/components/form-field";

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

export type PlayerOption = {
  id: string;
  first_name: string;
  last_name: string;
  matricule: string;
  category: string;
  team: string | null;
};

type CreateConvocationFormProps = {
  players: PlayerOption[];
  action: (
    prev: ConvocationFormState,
    formData: FormData,
  ) => Promise<ConvocationFormState>;
};

const initialState: ConvocationFormState = {};

function matchesSearch(player: PlayerOption, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    player.first_name.toLowerCase().includes(q) ||
    player.last_name.toLowerCase().includes(q) ||
    player.matricule.toLowerCase().includes(q) ||
    (player.team?.toLowerCase().includes(q) ?? false)
  );
}

export function CreateConvocationForm({
  players,
  action,
}: CreateConvocationFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [playerError, setPlayerError] = useState<string | undefined>();
  const [titleError, setTitleError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();

  const filtered = useMemo(
    () => players.filter((p) => matchesSearch(p, search)),
    [players, search],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setPlayerError(undefined);
  };

  const selectTeam = (team: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of players) {
        if (p.team === team) next.add(p.id);
      }
      return next;
    });
    setPlayerError(undefined);
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((p) => p.id)));
    setPlayerError(undefined);
  };

  const clearAll = () => setSelected(new Set());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "");
    const date = String(formData.get("event_date") ?? "");
    const tErr = validateRequired(title);
    const dErr = validateRequired(date);
    setTitleError(tErr);
    setDateError(dErr);
    if (selected.size === 0) {
      setPlayerError("Sélectionnez au moins un joueur.");
      return;
    }
    if (tErr || dErr) return;
    formAction(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-green-900">Nouvelle convocation</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <RequiredLabel htmlFor="conv-title">Titre</RequiredLabel>
          <input
            id="conv-title"
            name="title"
            required
            placeholder="Ex. Entraînement U15"
            className={`${inputClass} ${fieldErrorClass(!!titleError)}`}
            onBlur={(e) => setTitleError(validateRequired(e.target.value))}
          />
          <FieldError message={titleError} />
        </div>
        <div>
          <RequiredLabel htmlFor="conv-type">Type</RequiredLabel>
          <select id="conv-type" name="event_type" className={inputClass}>
            <option value="training">Entraînement</option>
            <option value="match">Match</option>
            <option value="other">Autre</option>
          </select>
        </div>
        <div>
          <label htmlFor="conv-location" className="mb-1 block text-sm text-green-800">
            Lieu
          </label>
          <input
            id="conv-location"
            name="location"
            placeholder="Stade de Sinfra"
            className={inputClass}
          />
        </div>
        <div>
          <RequiredLabel htmlFor="conv-date">Date</RequiredLabel>
          <input
            id="conv-date"
            name="event_date"
            type="date"
            required
            className={`${inputClass} ${fieldErrorClass(!!dateError)}`}
            onBlur={(e) => setDateError(validateRequired(e.target.value))}
          />
          <FieldError message={dateError} />
        </div>
        <div>
          <RequiredLabel htmlFor="conv-time">Heure</RequiredLabel>
          <input
            id="conv-time"
            name="event_time"
            type="time"
            defaultValue="09:00"
            required
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="conv-notes" className="mb-1 block text-sm text-green-800">
            Notes
          </label>
          <textarea id="conv-notes" name="notes" rows={2} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <RequiredLabel>Joueurs convoqués</RequiredLabel>
            <span className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{selected.size}</span>
              {" / "}
              {players.length} sélectionné{selected.size > 1 ? "s" : ""}
            </span>
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectTeam("U12")}
              className="rounded-full border border-green-300 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
            >
              Sélectionner U12
            </button>
            <button
              type="button"
              onClick={() => selectTeam("U16")}
              className="rounded-full border border-green-300 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
            >
              Sélectionner U16
            </button>
            <button
              type="button"
              onClick={selectAll}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Tout désélectionner
            </button>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou matricule…"
            className={`${inputClass} mb-2`}
          />
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-green-200 p-3">
            {filtered.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-green-50"
              >
                <input
                  type="checkbox"
                  name="player_ids"
                  value={p.id}
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-green-900">
                    {p.last_name} {p.first_name}
                  </span>
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-900">
                    {formatCategory(p.category)}
                  </span>
                  <span className={`ml-2 ${matriculeClass}`}>{p.matricule}</span>
                </span>
              </label>
            ))}
            {!filtered.length && (
              <p className="py-4 text-center text-sm text-slate-500">
                Aucun joueur ne correspond à la recherche.
              </p>
            )}
          </div>
          <FieldError message={playerError} />
        </div>
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Envoi..." : "Envoyer la convocation"}
      </button>
    </form>
  );
}
