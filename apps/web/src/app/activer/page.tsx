import Link from "next/link";
import { PhoneAuthForm } from "@/components/phone-auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { activateAccount } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ActiverPage() {
  const configured = isSupabaseConfigured();

  return (
    <AuthLayout
      title="Première connexion"
      subtitle="Activez votre accès avec votre numéro enregistré"
    >
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
          <p className="mb-4 text-sm text-green-700">
            Parents : utilisez le numéro indiqué sur la fiche de votre enfant.
            Staff : utilisez le numéro enregistré par l&apos;administration.
          </p>
          <PhoneAuthForm mode="activate" action={activateAccount} />
        </>
      )}
    </AuthLayout>
  );
}
