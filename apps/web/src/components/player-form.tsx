"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PLAYER_CATEGORIES } from "@/lib/players/constants";
import type { PlayerFormState } from "@/app/dashboard/joueurs/actions";

type PlayerFormProps = {
  action: (
    prevState: PlayerFormState,
    formData: FormData,
  ) => Promise<PlayerFormState>;
};

const initialState: PlayerFormState = {};

export function PlayerForm({ action }: PlayerFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-medium">Informations obligatoires</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Prénom(s)" name="first_name" required />
          <Field label="Nom" name="last_name" required />
          <Field label="Date de naissance" name="birth_date" type="date" required />
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Sexe</label>
            <select
              name="gender"
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
            >
              <option value="">Choisir</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Catégorie</label>
            <select
              name="category"
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm"
            >
              <option value="">Choisir</option>
              {PLAYER_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <Field label="Équipe" name="team" placeholder="Ex. U15 A" />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-medium">Informations complémentaires</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nom du père" name="father_name" />
          <Field label="Nom de la mère" name="mother_name" />
          <Field label="Tuteur" name="guardian_name" />
          <Field label="Téléphone" name="phone" type="tel" />
          <Field label="Adresse" name="address" className="sm:col-span-2" />
          <Field label="Pied fort" name="strong_foot" placeholder="Gauche / Droit / Les deux" />
          <Field label="Poste principal" name="primary_position" />
          <Field label="Poste secondaire" name="secondary_position" />
        </div>
      </section>

      {state.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer le joueur"}
        </button>
        <Link
          href="/dashboard/joueurs"
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm transition hover:border-zinc-500"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm text-zinc-400">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
      />
    </div>
  );
}
