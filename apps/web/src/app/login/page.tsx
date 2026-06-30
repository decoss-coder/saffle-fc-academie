import Link from "next/link";
import { PhoneAuthForm } from "@/components/phone-auth-form";
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
    <AuthLayout
      title="Accéder à la plateforme"
      subtitle="Connexion par numéro de téléphone"
    >
      {!configured ? (
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[#3f4b43]">
            Configuration Supabase en cours. Réessayez dans quelques minutes.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-full border border-[#d8b451]/40 px-5 py-2 text-sm font-semibold text-[#06110b] transition hover:bg-[#f2ead5]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      ) : (
        <>
          {params.error === "auth_callback_failed" && (
            <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              La confirmation du lien a échoué. Réessayez.
            </p>
          )}
          <PhoneAuthForm mode="login" action={signIn} />
        </>
      )}
    </AuthLayout>
  );
}
