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
          <p className="text-sm text-green-700">
            Configuration Supabase en cours. Réessayez dans quelques minutes.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-full border border-green-300 px-5 py-2 text-sm text-green-800 transition hover:bg-green-50"
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
