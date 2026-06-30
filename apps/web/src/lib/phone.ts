/** Normalise un numéro vers le format international (+...) */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (
    digits.length >= 11 &&
    !digits.startsWith("225") &&
    !digits.startsWith("0")
  ) {
    return `+${digits}`;
  }

  let normalized = digits;

  if (normalized.length === 10 && normalized.startsWith("0")) {
    normalized = `225${normalized}`;
  }

  if (normalized.length < 11) {
    return null;
  }

  return `+${normalized}`;
}

/** Email technique Supabase dérivé du téléphone */
export function phoneToAuthEmail(normalizedPhone: string): string {
  return `${normalizedPhone.replace(/\D/g, "")}@phone.saffle-fc.local`;
}

export function formatPhoneDisplay(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("225")) {
    const local = digits.slice(3);
    return `+225 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
  }
  return normalizedPhone;
}
