import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { signUp } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignupPage() {
  const configured = isSupabaseConfigured();

  return (
    <AuthLayout title="Créer un compte" subtitle="Inscription">
      {!configured ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Configuration Supabase en cours. Réessayez dans quelques minutes.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-full border border-zinc-700 px-5 py-2 text-sm transition hover:border-zinc-500"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      ) : (
        <AuthForm mode="signup" action={signUp} />
      )}
    </AuthLayout>
  );
}
