"use client";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
    >
      Imprimer / PDF
    </button>
  );
}
