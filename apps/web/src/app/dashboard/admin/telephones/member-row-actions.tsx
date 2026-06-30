"use client";

import { useState, useTransition } from "react";
import { CLUB } from "@/lib/club";
import { buildActivationMessage } from "@/lib/phone";
import {
  deactivateMember,
  resendActivationHint,
} from "./actions";

type MemberRowActionsProps = {
  phone: string;
  linkedUserId: string | null;
};

export function MemberRowActions({
  phone,
  linkedUserId,
}: MemberRowActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (linkedUserId) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Désactiver ce compte ? Le membre devra réactiver son accès.")) {
              return;
            }
            startTransition(async () => {
              const result = await deactivateMember(phone);
              setMessage(result.success ?? result.error ?? null);
            });
          }}
          className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Désactiver
        </button>
        {message && <span className="text-xs text-slate-600">{message}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
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
        className="rounded-full border border-green-300 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50 disabled:opacity-60"
      >
        Renvoyer le lien
      </button>
      {message && <span className="text-xs text-slate-600">{message}</span>}
    </div>
  );
}
