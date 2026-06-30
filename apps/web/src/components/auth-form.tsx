"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/app/auth/actions";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (
    prevState: AuthState,
    formData: FormData,
  ) => Promise<AuthState>;
};

const initialState: AuthState = {};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm text-zinc-400">
            Nom complet
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
            placeholder="Jean Dupont"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
          placeholder="vous@exemple.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : undefined}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2"
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-emerald-500 py-3 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending
          ? "Chargement..."
          : mode === "login"
            ? "Se connecter"
            : "Créer un compte"}
      </button>

      <p className="text-center text-sm text-zinc-400">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-emerald-400 hover:underline">
              S&apos;inscrire
            </Link>
          </>
        ) : (
          <>
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
