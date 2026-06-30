"use client";

import { useState } from "react";
import { formatPhoneDisplay, maskPhoneDisplay } from "@/lib/phone";
import { matriculeClass } from "@/lib/dashboard-ui";

type PhoneDisplayProps = {
  phone: string;
  className?: string;
};

export function PhoneDisplay({ phone, className = "" }: PhoneDisplayProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      className={`text-left ${matriculeClass} ${className} hover:text-slate-900`}
      title={revealed ? "Masquer le numéro" : "Afficher le numéro complet"}
    >
      {revealed ? formatPhoneDisplay(phone) : maskPhoneDisplay(phone)}
    </button>
  );
}
