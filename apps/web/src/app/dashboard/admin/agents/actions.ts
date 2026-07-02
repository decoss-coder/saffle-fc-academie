"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, phoneToAuthEmail } from "@/lib/phone";
import { STAFF_ROLES } from "@/lib/roles";
import { isProtectedMemberPhone } from "@/lib/super-admin";

export type PhoneRegistryState = {
  error?: string;
  success?: string;
  redirectTo?: string;
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

  revalidatePath("/dashboard/admin/agents");
  revalidatePath("/dashboard/admin/telephones");
  revalidatePath("/dashboard/comite");
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

  revalidatePath("/dashboard/admin/agents");
  revalidatePath("/dashboard/admin/telephones");
  revalidatePath("/dashboard/comite");
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

  revalidatePath("/dashboard/admin/agents");
  revalidatePath("/dashboard/admin/telephones");
  revalidatePath("/dashboard/comite");
  return { success: `Numéro enregistré pour ${fullName}.` };
}

export async function updateMember(
  _prevState: PhoneRegistryState,
  formData: FormData,
): Promise<PhoneRegistryState> {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  const oldPhone = String(formData.get("phone_normalized") ?? "").trim();
  const newPhone = normalizePhone(String(formData.get("phone") ?? ""));
  const fullName = String(formData.get("full_name") ?? "").trim();
  const positionTitle =
    String(formData.get("position_title") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "");

  if (
    !oldPhone ||
    !newPhone ||
    !fullName ||
    !STAFF_ROLE_VALUES.includes(role as (typeof STAFF_ROLE_VALUES)[number])
  ) {
    return { error: "Remplissez tous les champs obligatoires." };
  }

  const { data: existing } = await supabase
    .from("phone_registry")
    .select(
      "phone_normalized, linked_user_id, role, full_name, position_title, player_id",
    )
    .eq("phone_normalized", oldPhone)
    .maybeSingle();

  if (!existing) {
    return { error: "Membre introuvable." };
  }

  const revalidateStaff = () => {
    revalidatePath("/dashboard/admin/agents");
    revalidatePath("/dashboard/admin/telephones");
    revalidatePath("/dashboard/comite");
    revalidatePath(`/dashboard/admin/agents/${encodeURIComponent(oldPhone)}`);
    if (newPhone !== oldPhone) {
      revalidatePath(`/dashboard/admin/agents/${encodeURIComponent(newPhone)}`);
    }
  };

  if (newPhone === oldPhone) {
    const { error } = await supabase
      .from("phone_registry")
      .update({
        full_name: fullName,
        position_title: positionTitle,
        role,
      })
      .eq("phone_normalized", oldPhone);

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

    revalidateStaff();
    return { success: `${fullName} mis à jour.` };
  }

  if (isProtectedMemberPhone(oldPhone)) {
    return {
      error: "Le numéro de ce compte administrateur ne peut pas être modifié.",
    };
  }

  const { data: conflict } = await supabase
    .from("phone_registry")
    .select("phone_normalized")
    .eq("phone_normalized", newPhone)
    .maybeSingle();

  if (conflict) {
    return { error: "Ce numéro de téléphone est déjà utilisé." };
  }

  const { error: insertError } = await supabase.from("phone_registry").insert({
    phone_normalized: newPhone,
    role,
    full_name: fullName,
    position_title: positionTitle,
    player_id: existing.player_id,
    linked_user_id: existing.linked_user_id,
  });

  if (insertError) {
    return { error: "Impossible de mettre à jour le numéro de téléphone." };
  }

  await supabase
    .from("committee_dues")
    .update({ member_phone: newPhone })
    .eq("member_phone", oldPhone);

  await supabase
    .from("staff_salary_lines")
    .update({ beneficiary_phone: newPhone })
    .eq("beneficiary_phone", oldPhone);

  const { error: deleteError } = await supabase
    .from("phone_registry")
    .delete()
    .eq("phone_normalized", oldPhone);

  if (deleteError) {
    return {
      error:
        "Nouveau numéro enregistré mais l'ancienne fiche n'a pas pu être retirée. Contactez le support.",
    };
  }

  if (existing.linked_user_id) {
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        phone: newPhone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.linked_user_id);

    if (admin) {
      await admin.auth.admin.updateUserById(existing.linked_user_id, {
        email: phoneToAuthEmail(newPhone),
        phone: newPhone,
      });
    }
  }

  revalidateStaff();

  const from = String(formData.get("from") ?? "");
  const query = from === "comite" ? "?from=comite" : "";

  return {
    success: `${fullName} mis à jour avec le nouveau numéro.`,
    redirectTo: `/dashboard/admin/agents/${encodeURIComponent(newPhone)}${query}`,
  };
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

  revalidatePath("/dashboard/admin/agents");
  revalidatePath("/dashboard/admin/telephones");
  revalidatePath("/dashboard/comite");
  return { success: `${entry.full_name ?? "Membre"} supprimé du registre.` };
}
