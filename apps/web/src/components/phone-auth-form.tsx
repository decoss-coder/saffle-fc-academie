"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/app/auth/actions";

type PhoneAuthFormProps = {
  mode: "login" | "activate";
  action: (
    prevState: AuthState,
    formData: FormData,
  ) => Promise<AuthState>;
};

const initialState: AuthState = {};

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

export function PhoneAuthForm({ mode, action }: PhoneAuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm text-green-800">
          Numéro de téléphone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
          className={inputClass}
          placeholder="07 07 20 18 33"
        />
        <p className="mt-1 text-xs text-green-600">
          {mode === "login"
            ? "Le numéro enregistré sur la fiche de votre enfant ou par le club."
            : "Utilisez le numéro communiqué lors de l'inscription au club."}
        </p>
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-green-800">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      {mode === "activate" && (
        <div>
          <label
            htmlFor="password_confirm"
            className="mb-1 block text-sm text-green-800"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
      )}

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
        className="w-full rounded-full bg-green-800 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {pending
          ? "Chargement..."
          : mode === "login"
            ? "Se connecter"
            : "Activer mon compte"}
      </button>

      <p className="text-center text-sm text-green-700">
        {mode === "login" ? (
          <>
            Première connexion ?{" "}
            <Link href="/activer" className="font-medium text-green-800 hover:underline">
              Activer mon compte
            </Link>
          </>
        ) : (
          <>
            Déjà activé ?{" "}
            <Link href="/login" className="font-medium text-green-800 hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
