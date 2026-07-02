"use client";

import { useActionState, useState } from "react";
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

const passwordInputClass = `${inputClass} pr-11`;

function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder = "••••••••",
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[#1d3c2a]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          autoComplete={autoComplete}
          minLength={8}
          className={passwordInputClass}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#506153] transition hover:text-[#1d3c2a]"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
        >
          {visible ? (
            <svg
              aria-hidden
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
          ) : (
            <svg
              aria-hidden
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function PhoneAuthForm({ mode, action }: PhoneAuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-[#1d3c2a]">
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
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Mot de passe"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />

      {mode === "activate" ? (
        <PasswordField
          id="password_confirm"
          name="password_confirm"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
        />
      ) : null}

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
        className="w-full rounded-full bg-[#06110b] py-3 text-sm font-black text-white transition hover:bg-[#12351f] disabled:cursor-not-allowed disabled:opacity-60"
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
