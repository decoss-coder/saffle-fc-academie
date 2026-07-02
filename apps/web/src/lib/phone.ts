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

/** Segment d'URL sans caractères spéciaux (évite les 404 avec + / %2B). */
export function phoneToPathSegment(normalizedPhone: string): string {
  return normalizedPhone.replace(/\D/g, "");
}

/** Retrouve le numéro normalisé depuis un segment de route dynamique. */
export function phoneFromPathSegment(segment: string): string | null {
  const raw = decodeURIComponent(segment).trim();
  if (!raw) return null;

  const direct = normalizePhone(raw);
  if (direct) return direct;

  return normalizePhone(raw.replace(/\D/g, ""));
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
  if (digits.length >= 10) {
    const cc = digits.length > 10 ? digits.slice(0, digits.length - 10) : "";
    const rest = digits.slice(-10);
    const chunks = rest.match(/.{1,2}/g) ?? [rest];
    return cc ? `+${cc} ${chunks.join(" ")}` : `+${digits}`;
  }
  return normalizedPhone;
}

/** Masque partiel pour affichage RGPD (+225 07 •• •• 33) */
export function maskPhoneDisplay(normalizedPhone: string): string {
  const digits = normalizedPhone.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("225")) {
    const local = digits.slice(3);
    return `+225 ${local.slice(0, 2)} •• •• ${local.slice(8)}`;
  }
  if (digits.length > 4) {
    const formatted = formatPhoneDisplay(normalizedPhone);
    const prefix = formatted.split(" ").slice(0, 2).join(" ");
    return `${prefix} •• ${digits.slice(-2)}`;
  }
  return "••••";
}

export function buildActivationMessage(siteUrl: string, phone: string): string {
  return `Activez votre compte ${siteUrl}/activer avec votre numéro ${formatPhoneDisplay(phone)}.`;
}

