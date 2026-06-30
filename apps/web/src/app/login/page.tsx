import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { signIn } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <AuthLayout title="Accéder à la plateforme" subtitle="Connexion">
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
        <>
          {params.error === "auth_callback_failed" && (
            <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              La confirmation du lien a échoué. Réessayez.
            </p>
          )}
          <AuthForm mode="login" action={signIn} />
        </>
      )}
    </AuthLayout>
  );
}
