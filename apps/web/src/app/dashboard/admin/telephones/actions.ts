"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { STAFF_ROLES } from "@/lib/roles";
import { isProtectedMemberPhone } from "@/lib/super-admin";

export type PhoneRegistryState = {
  error?: string;
  success?: string;
};

const STAFF_ROLE_VALUES = STAFF_ROLES.map((r) => r.value);

export async function importMembers(
  _prevState: PhoneRegistryState,
): Promise<PhoneRegistryState> {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("import_saffle_members");

  if (error) {
    return { error: "Import impossible. Vérifiez vos droits administrateur." };
  }

  const result = data as {
    staff_upserted?: number;
    players_created?: number;
    players_skipped?: number;
  };

  revalidatePath("/dashboard/admin/telephones");
  revalidatePath("/dashboard/joueurs");

  return {
    success: `Import terminé : ${result.staff_upserted ?? 0} membre(s) bureau, ${result.players_created ?? 0} joueur(s) créé(s), ${result.players_skipped ?? 0} déjà présent(s).`,
  };
}

export async function resendActivationHint(
  _phoneNormalized: string,
): Promise<PhoneRegistryState> {
  await requireAdmin();
  return { success: "ok" };
}

export async function deactivateMember(
  phoneNormalized: string,
): Promise<PhoneRegistryState> {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Configuration serveur incomplète." };
  }

  const { data: entry } = await supabase
    .from("phone_registry")
    .select("linked_user_id")
    .eq("phone_normalized", phoneNormalized)
    .maybeSingle();

  if (!entry?.linked_user_id) {
    return { error: "Aucun compte actif à désactiver." };
  }

  const { error: authError } = await admin.auth.admin.deleteUser(
    entry.linked_user_id,
  );

  if (authError) {
    return { error: "Impossible de supprimer le compte auth." };
  }

  const { error } = await supabase
    .from("phone_registry")
    .update({ linked_user_id: null })
    .eq("phone_normalized", phoneNormalized);

  if (error) {
    return { error: "Compte auth supprimé mais registre non mis à jour." };
  }

  revalidatePath("/dashboard/admin/telephones");
  return { success: "Compte désactivé." };
}

export async function registerStaffPhone(
  _prevState: PhoneRegistryState,
  formData: FormData,
): Promise<PhoneRegistryState> {
  await requireAdmin();
  const supabase = await createClient();

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const fullName = String(formData.get("full_name") ?? "").trim();
  const positionTitle = String(formData.get("position_title") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "");

  if (
    !phone ||
    !fullName ||
    !STAFF_ROLE_VALUES.includes(role as (typeof STAFF_ROLE_VALUES)[number])
  ) {
    return { error: "Remplissez tous les champs obligatoires." };
  }

  const { error } = await supabase.from("phone_registry").upsert(
    {
      phone_normalized: phone,
      role,
      full_name: fullName,
      position_title: positionTitle,
      player_id: null,
    },
    { onConflict: "phone_normalized" },
  );

  if (error) {
    return { error: "Impossible d'enregistrer ce numéro." };
  }

  revalidatePath("/dashboard/admin/telephones");
  return { success: `Numéro enregistré pour ${fullName}.` };
}

export async function updateMember(
  _prevState: PhoneRegistryState,
  formData: FormData,
): Promise<PhoneRegistryState> {
  await requireAdmin();
  const supabase = await createClient();

  const phoneNormalized = String(formData.get("phone_normalized") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const positionTitle =
    String(formData.get("position_title") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "");

  if (
    !phoneNormalized ||
    !fullName ||
    !STAFF_ROLE_VALUES.includes(role as (typeof STAFF_ROLE_VALUES)[number])
  ) {
    return { error: "Remplissez tous les champs obligatoires." };
  }

  const { data: existing } = await supabase
    .from("phone_registry")
    .select("linked_user_id, role")
    .eq("phone_normalized", phoneNormalized)
    .maybeSingle();

  if (!existing) {
    return { error: "Membre introuvable." };
  }

  const { error } = await supabase
    .from("phone_registry")
    .update({
      full_name: fullName,
      position_title: positionTitle,
      role,
    })
    .eq("phone_normalized", phoneNormalized);

  if (error) {
    return { error: "Impossible de modifier ce membre." };
  }

  if (existing.linked_user_id) {
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.linked_user_id);
  }

  revalidatePath("/dashboard/admin/telephones");
  return { success: `${fullName} mis à jour.` };
}

export async function deleteMember(
  phoneNormalized: string,
): Promise<PhoneRegistryState> {
  await requireAdmin();

  if (isProtectedMemberPhone(phoneNormalized)) {
    return { error: "Ce compte administrateur ne peut pas être supprimé." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: entry } = await supabase
    .from("phone_registry")
    .select("linked_user_id, full_name")
    .eq("phone_normalized", phoneNormalized)
    .maybeSingle();

  if (!entry) {
    return { error: "Membre introuvable." };
  }

  const { count: paidDues } = await supabase
    .from("committee_dues")
    .select("*", { count: "exact", head: true })
    .eq("member_phone", phoneNormalized)
    .gt("amount_paid", 0);

  if ((paidDues ?? 0) > 0) {
    return {
      error: "Impossible de supprimer : cotisations comité déjà encaissées.",
    };
  }

  if (entry.linked_user_id && admin) {
    await admin.auth.admin.deleteUser(entry.linked_user_id);
  }

  const { error } = await supabase
    .from("phone_registry")
    .delete()
    .eq("phone_normalized", phoneNormalized);

  if (error) {
    return { error: "Suppression impossible." };
  }

  revalidatePath("/dashboard/admin/telephones");
  return { success: `${entry.full_name ?? "Membre"} supprimé du registre.` };
}
