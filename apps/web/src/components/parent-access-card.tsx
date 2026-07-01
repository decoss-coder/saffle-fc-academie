"use client";

import { useState } from "react";
import Link from "next/link";
import { CLUB } from "@/lib/club";
import { buildActivationMessage, formatPhoneDisplay } from "@/lib/phone";
import { StatusBadge } from "@/components/status-badge";

type ParentAccessCardProps = {
  playerName: string;
  phone: string;
  activated: boolean;
  guardianName?: string | null;
};

export function ParentAccessCard({
  playerName,
  phone,
  activated,
  guardianName,
}: ParentAccessCardProps) {
  const [message, setMessage] = useState<string | null>(null);

  const activationText = buildActivationMessage(CLUB.siteUrl, phone);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-green-900">Accès parent</h2>
          <p className="mt-1 text-sm text-slate-600">
            Le parent de {playerName} peut tester le parcours famille avec ce
            numéro.
          </p>
        </div>
        <StatusBadge
          label={activated ? "Compte activé" : "En attente d'activation"}
          variant={activated ? "good" : "warn"}
        />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-green-700">Téléphone parent</dt>
          <dd className="mt-1 font-medium text-green-950">
            {formatPhoneDisplay(phone)}
          </dd>
        </div>
        {guardianName ? (
          <div>
            <dt className="text-green-700">Nom affiché à l&apos;activation</dt>
            <dd className="mt-1 font-medium text-green-950">{guardianName}</dd>
          </div>
        ) : null}
      </dl>

      {!activated ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-green-800">
            1. Ouvrez{" "}
            <Link href="/activer" className="font-medium underline">
              /activer
            </Link>{" "}
            sur un téléphone (ou en navigation privée).
            <br />
            2. Saisissez le numéro ci-dessus et un mot de passe (8 caractères
            min.).
            <br />
            3. Le parent verra {playerName} dans « Mes enfants ».
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(activationText);
                  setMessage("Message d'activation copié — envoyez-le au parent.");
                } catch {
                  setMessage(activationText);
                }
              }}
              className="rounded-full bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Copier le message WhatsApp
            </button>
            <Link
              href="/activer"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-green-300 px-4 py-2 text-sm font-medium text-green-800 hover:bg-white"
            >
              Ouvrir /activer
            </Link>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-green-800">
          Ce parent peut se connecter sur{" "}
          <Link href="/login" className="font-medium underline">
            /login
          </Link>{" "}
          avec le même numéro et son mot de passe.
        </p>
      )}

      {message ? (
        <p className="mt-3 rounded-xl border border-green-200 bg-white px-3 py-2 text-xs text-slate-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}
