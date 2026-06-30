"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PLAYER_CATEGORIES, PLAYER_GROUPS } from "@/lib/players/constants";
import type { PlayerFormState } from "@/app/dashboard/joueurs/actions";

type PlayerFormProps = {
  action: (
    prevState: PlayerFormState,
    formData: FormData,
  ) => Promise<PlayerFormState>;
};

const initialState: PlayerFormState = {};
const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

export function PlayerForm({ action }: PlayerFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-green-900">
          Informations obligatoires
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Prénom(s)" name="first_name" required />
          <Field label="Nom" name="last_name" required />
          <Field label="Date de naissance" name="birth_date" type="date" required />
          <div>
            <label className="mb-1 block text-sm text-green-800">Sexe</label>
            <select name="gender" required className={inputClass}>
              <option value="">Choisir</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-green-800">Groupe / équipe</label>
            <select name="team_group" required className={inputClass} defaultValue="">
              <option value="">Choisir</option>
              {PLAYER_GROUPS.map((g) => (
                <option key={g.team} value={g.team}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-green-800">Catégorie FFF</label>
            <select name="category" required className={inputClass}>
              <option value="">Choisir</option>
              {PLAYER_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-green-900">
          Informations complémentaires
        </h2>
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
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer le joueur"}
        </button>
        <Link
          href="/dashboard/joueurs"
          className="rounded-full border border-green-300 px-6 py-3 text-sm text-green-800 transition hover:bg-green-50"
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
      <label htmlFor={name} className="mb-1 block text-sm text-green-800">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}
