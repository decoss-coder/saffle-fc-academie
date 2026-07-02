"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { PhoneRegistryState } from "./actions";
import { STAFF_ROLES } from "@/lib/roles";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  FieldError,
  RequiredLabel,
  fieldErrorClass,
  validateRequired,
} from "@/components/form-field";

const initialState: PhoneRegistryState = {};

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type StaffMemberFormProps = {
  mode: "create" | "edit";
  action: (
    prev: PhoneRegistryState,
    formData: FormData,
  ) => Promise<PhoneRegistryState>;
  defaultValues?: {
    phone_normalized: string;
    full_name: string | null;
    position_title: string | null;
    role: string;
  };
  from?: "comite" | "agents";
};

export function StaffMemberForm({
  mode,
  action,
  defaultValues,
  from,
}: StaffMemberFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);
  const [nameError, setNameError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [roleError, setRoleError] = useState<string | undefined>();

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
      return;
    }
    if (state.success) {
      router.refresh();
    }
  }, [state.redirectTo, state.success, router]);

  const phoneDefault =
    mode === "edit" && defaultValues?.phone_normalized
      ? formatPhoneDisplay(defaultValues.phone_normalized)
      : "";

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-green-900">
        {mode === "create" ? "Enregistrer un agent" : "Modifier la fiche"}
      </h2>
      <p className="text-sm text-slate-600">
        {mode === "create"
          ? "Bureau, coach, encadrement… La personne activera son compte avec ce numéro."
          : "Modifiez le numéro, le nom, le poste et les droits sur la plateforme."}
      </p>

      {mode === "edit" && defaultValues ? (
        <input
          type="hidden"
          name="phone_normalized"
          value={defaultValues.phone_normalized}
        />
      ) : null}
      {mode === "edit" && from ? (
        <input type="hidden" name="from" value={from} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="full_name">Nom et prénom</RequiredLabel>
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={defaultValues?.full_name ?? ""}
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
            defaultValue={phoneDefault}
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
            defaultValue={defaultValues?.position_title ?? ""}
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
            defaultValue={defaultValues?.role ?? ""}
            className={`${inputClass} ${fieldErrorClass(!!roleError)}`}
            onBlur={(e) =>
              setRoleError(e.target.value ? undefined : "Choisissez un rôle.")
            }
          >
            {mode === "create" ? <option value="">Choisir</option> : null}
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
        {pending
          ? "Enregistrement..."
          : mode === "create"
            ? "Enregistrer l'agent"
            : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
