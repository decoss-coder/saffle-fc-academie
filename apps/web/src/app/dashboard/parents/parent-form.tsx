"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { ParentFormState } from "./actions";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  FieldError,
  RequiredLabel,
  fieldErrorClass,
  validateRequired,
} from "@/components/form-field";

const initialState: ParentFormState = {};

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type ParentFormProps = {
  action: (
    prev: ParentFormState,
    formData: FormData,
  ) => Promise<ParentFormState>;
  defaultValues: {
    phone_normalized: string;
    full_name: string | null;
  };
};

export function ParentForm({ action, defaultValues }: ParentFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);
  const [nameError, setNameError] = useState<string | undefined>();
  const [phoneError, setPhoneError] = useState<string | undefined>();

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

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-medium text-green-900">Modifier la fiche</h2>
      <p className="text-sm text-slate-600">
        Modifiez le nom et le numéro du parent. Les fiches joueurs liées seront
        mises à jour.
      </p>

      <input
        type="hidden"
        name="phone_normalized"
        value={defaultValues.phone_normalized}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <RequiredLabel htmlFor="full_name">Nom et prénom</RequiredLabel>
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={defaultValues.full_name ?? ""}
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
            defaultValue={formatPhoneDisplay(defaultValues.phone_normalized)}
            className={`${inputClass} ${fieldErrorClass(!!phoneError)}`}
            placeholder="07 07 20 18 33"
            onBlur={(e) => setPhoneError(validateRequired(e.target.value))}
          />
          <FieldError message={phoneError} />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-800 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
