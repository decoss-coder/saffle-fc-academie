"use client";

import { useActionState } from "react";
import type { PhoneRegistryState } from "./actions";

const initialState: PhoneRegistryState = {};

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type StaffPhoneFormProps = {
  action: (
    prevState: PhoneRegistryState,
    formData: FormData,
  ) => Promise<PhoneRegistryState>;
};

export function StaffPhoneForm({ action }: StaffPhoneFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-green-900">
        Enregistrer un numéro staff
      </h2>
      <p className="text-sm text-green-700">
        Coach, trésorier, admin… Ces personnes activeront leur compte avec ce numéro.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm text-green-800">
            Nom complet
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            className={inputClass}
            placeholder="Jean Kouassi"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm text-green-800">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className={inputClass}
            placeholder="07 07 20 18 33"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="role" className="mb-1 block text-sm text-green-800">
            Rôle
          </label>
          <select id="role" name="role" required className={inputClass}>
            <option value="">Choisir</option>
            <option value="admin">Administrateur</option>
            <option value="president">Président</option>
            <option value="board">Bureau</option>
            <option value="treasurer">Trésorier</option>
            <option value="coach">Coach</option>
            <option value="communication">Communication</option>
            <option value="logistics">Logistique</option>
          </select>
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
        {pending ? "Enregistrement..." : "Enregistrer le numéro"}
      </button>
    </form>
  );
}
