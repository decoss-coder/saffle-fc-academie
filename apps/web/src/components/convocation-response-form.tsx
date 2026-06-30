"use client";

import { useActionState } from "react";
import type { ConvocationFormState } from "@/app/dashboard/convocations/actions";
import { CONVOCATION_RESPONSES } from "@/lib/convocations/constants";

const initialState: ConvocationFormState = {};

type ConvocationResponseFormProps = {
  entryId: string;
  action: (
    prev: ConvocationFormState,
    formData: FormData,
  ) => Promise<ConvocationFormState>;
};

export function ConvocationResponseForm({
  entryId,
  action,
}: ConvocationResponseFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-xl border border-green-100 bg-green-50/50 p-4">
      <input type="hidden" name="entry_id" value={entryId} />
      <div className="flex flex-wrap gap-2">
        {CONVOCATION_RESPONSES.map((item) => (
          <label
            key={item.value}
            className="cursor-pointer rounded-full border border-green-300 bg-white px-3 py-1.5 text-sm text-green-800 has-[:checked]:border-green-700 has-[:checked]:bg-green-800 has-[:checked]:text-white"
          >
            <input
              type="radio"
              name="response"
              value={item.value}
              className="sr-only"
              required
            />
            {item.label}
          </label>
        ))}
      </div>
      <textarea
        name="comment"
        rows={2}
        placeholder="Commentaire (optionnel)"
        className="w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm text-green-950"
      />
      {state.error && (
        <p className="text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-green-800">{state.success}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {pending ? "Envoi..." : "Envoyer ma réponse"}
      </button>
    </form>
  );
}
