"use client";

import { useActionState } from "react";
import Link from "next/link";
import { PLAYER_CATEGORIES, PLAYER_GROUPS } from "@/lib/players/constants";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/lib/players/countries";
import type { PlayerFormState } from "@/app/dashboard/joueurs/actions";

export type PlayerFormValues = {
  id?: string;
  first_name: string;
  last_name: string;
  birth_name?: string | null;
  birth_date: string;
  gender: string;
  team?: string | null;
  category: string;
  nationality?: string | null;
  secondary_nationality?: string | null;
  birth_country?: string | null;
  birth_region?: string | null;
  birth_city?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  guardian_name?: string | null;
  phone?: string | null;
  address?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  strong_foot?: string | null;
  primary_position?: string | null;
  secondary_position?: string | null;
  birth_certificate_ref?: string | null;
  former_license_number?: string | null;
};

type PlayerFormProps = {
  action: (
    prevState: PlayerFormState,
    formData: FormData,
  ) => Promise<PlayerFormState>;
  player?: PlayerFormValues;
  defaultTeamGroup?: string;
  cancelHref?: string;
};

const initialState: PlayerFormState = {};
const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

export function PlayerForm({
  action,
  player,
  defaultTeamGroup,
  cancelHref = "/dashboard/joueurs",
}: PlayerFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEdit = Boolean(player?.id);
  const teamDefault = player?.team ?? defaultTeamGroup ?? "";
  const categoryDefault =
    player?.category ??
    PLAYER_GROUPS.find((g) => g.team === teamDefault)?.category ??
    "";

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="player_id" value={player!.id} />}

      <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-green-900">Identité</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Prénom(s)"
            name="first_name"
            required
            defaultValue={player?.first_name}
          />
          <Field
            label="Nom"
            name="last_name"
            required
            defaultValue={player?.last_name}
          />
          <Field
            label="Nom de naissance"
            name="birth_name"
            placeholder="Si différent du nom actuel"
            defaultValue={player?.birth_name ?? ""}
            className="sm:col-span-2"
          />
          <Field
            label="Date de naissance"
            name="birth_date"
            type="date"
            required
            defaultValue={player?.birth_date}
          />
          <div>
            <label className="mb-1 block text-sm text-green-800">Sexe</label>
            <select
              name="gender"
              required
              className={inputClass}
              defaultValue={player?.gender ?? ""}
            >
              <option value="">Choisir</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-green-900">
          Nationalité et lieu de naissance
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CountrySelect
            label="Nationalité principale"
            name="nationality"
            defaultValue={player?.nationality ?? DEFAULT_COUNTRY}
          />
          <CountrySelect
            label="2e nationalité"
            name="secondary_nationality"
            defaultValue={player?.secondary_nationality ?? ""}
            allowEmpty
          />
          <CountrySelect
            label="Pays de naissance"
            name="birth_country"
            defaultValue={player?.birth_country ?? DEFAULT_COUNTRY}
          />
          <Field
            label="Région ou État de naissance"
            name="birth_region"
            defaultValue={player?.birth_region ?? ""}
          />
          <Field
            label="Ville de naissance"
            name="birth_city"
            defaultValue={player?.birth_city ?? ""}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-green-900">Effectif club</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-green-800">
              Groupe / équipe
            </label>
            <select
              name="team_group"
              required
              className={inputClass}
              defaultValue={teamDefault}
            >
              <option value="">Choisir</option>
              {PLAYER_GROUPS.map((g) => (
                <option key={g.team} value={g.team}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-green-800">
              Catégorie FFF
            </label>
            <select
              name="category"
              required
              className={inputClass}
              defaultValue={categoryDefault}
            >
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
        <h2 className="text-lg font-medium text-green-900">Famille et contact</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Nom du père"
            name="father_name"
            defaultValue={player?.father_name ?? ""}
          />
          <Field
            label="Nom de la mère"
            name="mother_name"
            defaultValue={player?.mother_name ?? ""}
          />
          <Field
            label="Tuteur"
            name="guardian_name"
            defaultValue={player?.guardian_name ?? ""}
          />
          <Field
            label="Téléphone"
            name="phone"
            type="tel"
            placeholder="07 07 20 18 33"
            defaultValue={player?.phone ?? ""}
          />
          <p className="sm:col-span-2 text-sm text-slate-600">
            Numéro du parent ou tuteur. S&apos;il appartient déjà à un membre
            staff (admin, coach…), l&apos;enfant sera lié à son compte existant
            — le menu <strong>Famille</strong> apparaîtra après connexion.
            Sinon, activation sur <strong>/activer</strong>.
          </p>
          <Field
            label="Adresse"
            name="address"
            defaultValue={player?.address ?? ""}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-green-900">Profil sportif</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Taille (cm)"
            name="height_cm"
            type="number"
            min="0"
            step="0.1"
            defaultValue={player?.height_cm?.toString() ?? ""}
          />
          <Field
            label="Poids (kg)"
            name="weight_kg"
            type="number"
            min="0"
            step="0.1"
            defaultValue={player?.weight_kg?.toString() ?? ""}
          />
          <Field
            label="Pied fort"
            name="strong_foot"
            placeholder="Gauche / Droit / Les deux"
            defaultValue={player?.strong_foot ?? ""}
          />
          <Field
            label="Poste principal"
            name="primary_position"
            defaultValue={player?.primary_position ?? ""}
          />
          <Field
            label="Poste secondaire"
            name="secondary_position"
            defaultValue={player?.secondary_position ?? ""}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-green-900">
          Documents fédération
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Réf. certificat de naissance"
            name="birth_certificate_ref"
            defaultValue={player?.birth_certificate_ref ?? ""}
          />
          <Field
            label="Ancien n° Licence Plus"
            name="former_license_number"
            defaultValue={player?.former_license_number ?? ""}
          />
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
          {pending
            ? "Enregistrement..."
            : isEdit
              ? "Enregistrer les modifications"
              : "Enregistrer le joueur"}
        </button>
        <Link
          href={cancelHref}
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
  defaultValue,
  min,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  min?: string;
  step?: string;
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
        defaultValue={defaultValue}
        min={min}
        step={step}
        className={inputClass}
      />
    </div>
  );
}

function CountrySelect({
  label,
  name,
  defaultValue,
  allowEmpty,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  allowEmpty?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-green-800">{label}</label>
      <select name={name} className={inputClass} defaultValue={defaultValue ?? ""}>
        {allowEmpty && <option value="">—</option>}
        {COUNTRIES.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
    </div>
  );
}
