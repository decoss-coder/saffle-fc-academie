"use client";

import { useActionState, useState } from "react";
import type { PhoneRegistryState } from "./actions";
import { STAFF_ROLES } from "@/lib/roles";
import {
  FieldError,
  RequiredLabel,
  fieldErrorClass,
  validateRequired,
} from "@/components/form-field";

const initialState: PhoneRegistryState = {};

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type StaffPhoneFormProps = {
  action: (
    prev: PhoneRegistryState,
    formData: FormData,
  ) => Promise<PhoneRegistryState>;
};

export function StaffPhoneForm({ action }: StaffPhoneFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [nameError, setNameError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [roleError, setRoleError] = useState<string | undefined>();

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-green-900">
        Enregistrer un membre staff
      </h2>
      <p className="text-sm text-slate-600">
        Bureau, coach, trésorier… La personne activera son compte avec ce numéro.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="full_name">Nom complet</RequiredLabel>
          <input
            id="full_name"
            name="full_name"
            required
            className={`${inputClass} ${fieldErrorClass(!!nameError)}`}
            placeholder="Jean Kouassi"
            onBlur={(e) => setNameError(validateRequired(e.target.value))}
          />
          <FieldError message={nameError} />
        </div>
        <div>
          <RequiredLabel htmlFor="phone">Téléphone</RequiredLabel>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className={`${inputClass} ${fieldErrorClass(!!phoneError)}`}
            placeholder="07 07 20 18 33"
            onBlur={(e) => setPhoneError(validateRequired(e.target.value))}
          />
          <FieldError message={phoneError} />
        </div>
        <div>
          <label
            htmlFor="position_title"
            className="mb-1 block text-sm text-green-800"
          >
            Poste / fonction
          </label>
          <input
            id="position_title"
            name="position_title"
            className={inputClass}
            placeholder="Ex. Vice-président, Entraîneur U10"
          />
        </div>
        <div>
          <RequiredLabel htmlFor="role">Droits sur la plateforme</RequiredLabel>
          <select
            id="role"
            name="role"
            required
            className={`${inputClass} ${fieldErrorClass(!!roleError)}`}
            defaultValue=""
            onBlur={(e) =>
              setRoleError(e.target.value ? undefined : "Choisissez un rôle.")
            }
          >
            <option value="">Choisir</option>
            {STAFF_ROLES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <FieldError message={roleError} />
        </div>
      </div>

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
        className="rounded-full bg-green-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer le membre"}
      </button>
    </form>
  );
}
