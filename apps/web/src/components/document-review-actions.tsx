"use client";

import { useActionState } from "react";
import { reviewPlayerDocument } from "@/app/dashboard/documents/actions";
import type { DocumentActionState } from "@/app/dashboard/documents/actions";

const initialState: DocumentActionState = {};

type DocumentReviewActionsProps = {
  documentId: string;
  playerId: string;
  currentStatus: string;
};

export function DocumentReviewActions({
  documentId,
  playerId,
  currentStatus,
}: DocumentReviewActionsProps) {
  const [state, formAction, pending] = useActionState(
    reviewPlayerDocument,
    initialState,
  );

  if (currentStatus !== "pending") {
    return null;
  }

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="document_id" value={documentId} />
      <input type="hidden" name="player_id" value={playerId} />
      <textarea
        name="admin_note"
        rows={2}
        placeholder="Note pour le parent (optionnel, surtout en cas de rejet)"
        className="w-full rounded-xl border border-green-200 px-3 py-2 text-sm text-green-950 outline-none ring-green-600 focus:ring-2"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="status"
          value="approved"
          disabled={pending}
          className="rounded-full bg-green-800 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          Approuver
        </button>
        <button
          type="submit"
          name="status"
          value="rejected"
          disabled={pending}
          className="rounded-full border border-red-300 px-4 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Rejeter
        </button>
      </div>
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-green-700">{state.success}</p>
      )}
    </form>
  );
}
