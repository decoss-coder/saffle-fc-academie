"use client";

import { useActionState } from "react";
import { importMembers, type PhoneRegistryState } from "./actions";

const initial: PhoneRegistryState = {};

export function ImportMembersButton() {
  const [state, action, pending] = useActionState(importMembers, initial);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {pending ? "Import en cours…" : "Importer les membres en masse"}
        </button>
      </form>
      {state.success && (
        <p className="text-sm text-green-800">{state.success}</p>
      )}
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
    </div>
  );
}
