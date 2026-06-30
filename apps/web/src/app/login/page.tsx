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
        <>
          {params.error === "auth_callback_failed" && (
            <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              La confirmation du lien a échoué. Réessayez.
            </p>
          )}
          <AuthForm mode="login" action={signIn} />
        </>
      )}
    </AuthLayout>
  );
}
