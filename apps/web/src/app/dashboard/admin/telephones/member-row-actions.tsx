"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteMember, updateMember, resendActivationHint, deactivateMember } from "./actions";
import { STAFF_ROLES } from "@/lib/roles";
import { RequiredLabel } from "@/components/form-field";
import { CLUB } from "@/lib/club";
import { buildActivationMessage } from "@/lib/phone";

const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type MemberRowActionsProps = {
  phone: string;
  linkedUserId: string | null;
  fullName: string | null;
  positionTitle: string | null;
  role: string;
};

export function MemberRowActions({
  phone,
  linkedUserId,
  fullName,
  positionTitle,
  role,
}: MemberRowActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [state, formAction, formPending] = useActionState(updateMember, {});

  if (editing) {
    return (
      <form action={formAction} className="min-w-[280px] space-y-2">
        <input type="hidden" name="phone_normalized" value={phone} />
        <div>
          <RequiredLabel htmlFor={`name-${phone}`}>Nom</RequiredLabel>
          <input
            id={`name-${phone}`}
            name="full_name"
            required
            defaultValue={fullName ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor={`position-${phone}`}
            className="mb-1 block text-xs text-green-800"
          >
            Poste
          </label>
          <input
            id={`position-${phone}`}
            name="position_title"
            defaultValue={positionTitle ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <RequiredLabel htmlFor={`role-${phone}`}>Rôle</RequiredLabel>
          <select
            id={`role-${phone}`}
            name="role"
            required
            defaultValue={role}
            className={inputClass}
          >
            {STAFF_ROLES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {state.error && (
          <p className="text-xs text-red-600">{state.error}</p>
        )}
        {state.success && (
          <p className="text-xs text-green-700">{state.success}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={formPending}
            className="rounded-full bg-green-800 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-green-300 px-3 py-1 text-xs text-green-800"
          >
            Annuler
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-green-300 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50"
        >
          Modifier
        </button>
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
              setMessage(result.success ?? result.error ?? null);
            });
          }}
          className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>

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
            });
          }}
          className="rounded-full border border-amber-300 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-60"
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
          className="rounded-full border border-green-300 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50 disabled:opacity-60"
        >
          Renvoyer le lien
        </button>
      )}

      {message && <span className="text-xs text-slate-600">{message}</span>}
    </div>
  );
}
