"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cancelPayment, type PaymentFormState } from "@/app/dashboard/paiements/actions";
import { ClubFormMessages } from "@/components/club-ui";

export function CancelPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, action, pending] = useActionState(cancelPayment, {} as PaymentFormState);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="payment_id" value={paymentId} />
      <input
        name="reason"
        required
        placeholder="Motif d'annulation"
        className="min-w-[12rem] rounded-lg border border-green-200 px-2 py-1 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        Annuler
      </button>
      <ClubFormMessages error={state.error} success={state.success} />
    </form>
  );
}

export function ReceiptLink({ paymentId, receiptNumber }: { paymentId: string; receiptNumber?: string | null }) {
  if (!receiptNumber) return <span className="text-slate-400">—</span>;
  return (
    <Link
      href={`/dashboard/paiements/receipt/${paymentId}`}
      className="font-mono text-xs text-green-800 underline"
    >
      {receiptNumber}
    </Link>
  );
}
