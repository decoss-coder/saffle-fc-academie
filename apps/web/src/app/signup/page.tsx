import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignupPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
          Inscription
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Créer un compte</h1>

        {!configured ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-zinc-400">
              Supabase n&apos;est pas encore configuré.
            </p>
            <Link
              href="/"
              className="inline-flex rounded-full border border-zinc-700 px-5 py-2 text-sm transition hover:border-zinc-500"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <AuthForm mode="signup" action={signUp} />
          </div>
        )}
      </div>
    </div>
  );
}
