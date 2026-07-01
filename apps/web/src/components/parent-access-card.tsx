"use client";

import { useState } from "react";
import Link from "next/link";
import { CLUB } from "@/lib/club";
import { buildActivationMessage, formatPhoneDisplay } from "@/lib/phone";
import { formatRole } from "@/lib/roles";
import { StatusBadge } from "@/components/status-badge";

type ParentAccessCardProps = {
  playerName: string;
  phone: string;
  activated: boolean;
  guardianName?: string | null;
  linkMode?: "parent" | "staff_guardian" | "staff_pending";
  registryRole?: string | null;
};

export function ParentAccessCard({
  playerName,
  phone,
  activated,
  guardianName,
  linkMode = "parent",
  registryRole,
}: ParentAccessCardProps) {
  const [message, setMessage] = useState<string | null>(null);

  const activationText = buildActivationMessage(CLUB.siteUrl, phone);
  const isStaffHybrid = linkMode !== "parent";
  const staffLabel = registryRole ? formatRole(registryRole) : "membre staff";

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-green-900">
            {isStaffHybrid ? "Accès parent (membre staff)" : "Accès parent"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {isStaffHybrid
              ? `Ce numéro est déjà un compte ${staffLabel}. L'enfant ${playerName} sera lié à ce compte sans changer son rôle staff.`
              : `Le parent de ${playerName} peut activer le parcours famille avec ce numéro.`}
          </p>
        </div>
        <StatusBadge
          label={
            activated
              ? isStaffHybrid
                ? "Compte staff actif — enfant lié"
                : "Compte activé"
              : "En attente d'activation"
          }
          variant={activated ? "good" : "warn"}
        />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-green-700">Téléphone</dt>
          <dd className="mt-1 font-medium text-green-950">
            {formatPhoneDisplay(phone)}
          </dd>
        </div>
        {guardianName ? (
          <div>
            <dt className="text-green-700">Contact / tuteur</dt>
            <dd className="mt-1 font-medium text-green-950">{guardianName}</dd>
          </div>
        ) : null}
      </dl>

      {activated ? (
        <p className="mt-4 text-sm text-green-800">
          {isStaffHybrid ? (
            <>
              Connectez-vous sur{" "}
              <Link href="/login" className="font-medium underline">
                /login
              </Link>{" "}
              avec ce numéro. Le menu <strong>Famille → Mes enfants</strong>{" "}
              affichera {playerName} en plus de vos droits {staffLabel}.
            </>
          ) : (
            <>
              Ce parent peut se connecter sur{" "}
              <Link href="/login" className="font-medium underline">
                /login
              </Link>{" "}
              avec le même numéro et son mot de passe.
            </>
          )}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-green-800">
            {isStaffHybrid ? (
              <>
                1. Activez le compte staff sur{" "}
                <Link href="/activer" className="font-medium underline">
                  /activer
                </Link>{" "}
                avec ce numéro (une seule fois).
                <br />
                2. Après connexion, {playerName} apparaîtra dans{" "}
                <strong>Mes enfants</strong>.
              </>
            ) : (
              <>
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
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(activationText);
                  setMessage("Message copié — envoyez-le au parent.");
                } catch {
                  setMessage(activationText);
                }
              }}
              className="rounded-full bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Copier le message
            </button>
            <Link
              href={activated ? "/login" : "/activer"}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-green-300 px-4 py-2 text-sm font-medium text-green-800 hover:bg-white"
            >
              {isStaffHybrid ? "Ouvrir /activer (staff)" : "Ouvrir /activer"}
            </Link>
          </div>
        </div>
      )}

      {message ? (
        <p className="mt-3 rounded-xl border border-green-200 bg-white px-3 py-2 text-xs text-slate-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}
