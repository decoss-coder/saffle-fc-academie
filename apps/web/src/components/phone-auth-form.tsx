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
  "w-full rounded-lg border border-[#d9dfd7] bg-white px-4 py-3 text-base text-[#06110b] outline-none transition placeholder:text-[#7f8a82] focus:border-[#d8b451] focus:ring-2 focus:ring-[#d8b451]/25";

export function PhoneAuthForm({ mode, action }: PhoneAuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-[#1d3c2a]">
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
        <p className="mt-2 text-xs leading-5 text-[#607064]">
          {mode === "login"
            ? "Le numéro enregistré sur la fiche de votre enfant ou par le club."
            : "Utilisez le numéro communiqué lors de l'inscription au club."}
        </p>
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#1d3c2a]">
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
            className="mb-2 block text-sm font-semibold text-[#1d3c2a]"
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
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-[#06110b] py-3.5 text-sm font-black text-white transition hover:bg-[#12351f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Chargement..."
          : mode === "login"
            ? "Se connecter"
            : "Activer mon compte"}
      </button>

      <p className="text-center text-sm text-[#506153]">
        {mode === "login" ? (
          <>
            Première connexion ?{" "}
            <Link href="/activer" className="font-bold text-[#0b6f32] hover:underline">
              Activer mon compte
            </Link>
          </>
        ) : (
          <>
            Déjà activé ?{" "}
            <Link href="/login" className="font-bold text-[#0b6f32] hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
