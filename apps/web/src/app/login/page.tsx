import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
          Connexion
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Accéder à la plateforme</h1>
        <p className="mt-3 text-sm text-zinc-400">
          L&apos;authentification Supabase sera branchée ici. Configurez vos
          variables d&apos;environnement pour activer la connexion.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-zinc-700 px-5 py-2 text-sm transition hover:border-zinc-500"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
