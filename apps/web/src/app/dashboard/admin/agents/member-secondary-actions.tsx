"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteMember,
  resendActivationHint,
  deactivateMember,
} from "./actions";
import { CLUB } from "@/lib/club";
import { buildActivationMessage } from "@/lib/phone";

type MemberSecondaryActionsProps = {
  phone: string;
  linkedUserId: string | null;
  redirectAfterDelete?: string;
};

export function MemberSecondaryActions({
  phone,
  linkedUserId,
  redirectAfterDelete,
}: MemberSecondaryActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                "Supprimer ce membre du registre ? Les cotisations comité non payées seront aussi supprimées.",
              )
            ) {
              return;
            }
            startTransition(async () => {
              const result = await deleteMember(phone);
              if (result.success && redirectAfterDelete) {
                router.push(redirectAfterDelete);
                router.refresh();
                return;
              }
              setMessage(result.success ?? result.error ?? null);
            });
          }}
          className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Supprimer
        </button>

        {linkedUserId ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                !confirm(
                  "Désactiver ce compte ? Le membre devra réactiver son accès.",
                )
              ) {
                return;
              }
              startTransition(async () => {
                const result = await deactivateMember(phone);
                setMessage(result.success ?? result.error ?? null);
                router.refresh();
              });
            }}
            className="rounded-full border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-60"
          >
            Désactiver le compte
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              const text = buildActivationMessage(CLUB.siteUrl, phone);
              try {
                await navigator.clipboard.writeText(text);
                await resendActivationHint(phone);
                setMessage("Message copié — envoyez-le au membre par WhatsApp.");
              } catch {
                setMessage(text);
              }
            }}
            className="rounded-full border border-green-300 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50 disabled:opacity-60"
          >
            Renvoyer le lien d&apos;activation
          </button>
        )}
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
