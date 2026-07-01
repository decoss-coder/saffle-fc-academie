/** Compte plateforme avec accès total — Boty Dia Armel */
export const SUPER_ADMIN_PHONE = "+2250707189702";
export const SUPER_ADMIN_NAME = "boty dia armel";

export function isSuperAdminPhone(phone: string | null | undefined): boolean {
  return phone === SUPER_ADMIN_PHONE;
}

export function isSuperAdminName(name: string | null | undefined): boolean {
  return (name ?? "").trim().toLowerCase() === SUPER_ADMIN_NAME;
}

export function isSuperAdminIdentity(
  phone: string | null | undefined,
  fullName: string | null | undefined,
): boolean {
  return isSuperAdminPhone(phone) || isSuperAdminName(fullName);
}

export function isProtectedMemberPhone(phone: string): boolean {
  return phone === SUPER_ADMIN_PHONE;
}
