"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, phoneToAuthEmail } from "@/lib/phone";
import { buildParentKey, parseParentKey } from "@/lib/parents/directory";
import { isProtectedMemberPhone } from "@/lib/super-admin";

export type ParentFormState = {
  error?: string;
  success?: string;
  redirectTo?: string;
};

function revalidateParentPaths(oldPhone: string, newPhone?: string) {
  revalidatePath("/dashboard/parents");
  revalidatePath("/dashboard");
  const oldKey = buildParentKey(oldPhone);
  if (oldKey) {
    revalidatePath(`/dashboard/parents/${oldKey}`);
  }
  if (newPhone && newPhone !== oldPhone) {
    const newKey = buildParentKey(newPhone);
    if (newKey) {
      revalidatePath(`/dashboard/parents/${newKey}`);
    }
  }
}

async function syncLinkedPlayers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  oldPhone: string,
  newPhone: string,
  fullName: string,
) {
  const { data: players } = await supabase
    .from("players")
    .select("id, phone")
    .eq("is_archived", false);

  const matching =
    players?.filter(
      (player) => normalizePhone(player.phone ?? "") === oldPhone,
    ) ?? [];

  for (const player of matching) {
    await supabase
      .from("players")
      .update({
        phone: newPhone,
        guardian_name: fullName,
      })
      .eq("id", player.id);
  }
}

export async function resendParentActivationHint(
  _phoneNormalized: string,
): Promise<ParentFormState> {
  await requireAdmin();
  return { success: "ok" };
}

export async function deactivateParent(
  phoneNormalized: string,
): Promise<ParentFormState> {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Configuration serveur incomplète." };
  }

  const { data: entry } = await supabase
    .from("phone_registry")
    .select("linked_user_id, role")
    .eq("phone_normalized", phoneNormalized)
    .maybeSingle();

  if (!entry || entry.role !== "parent") {
    return { error: "Parent introuvable." };
  }

  if (!entry.linked_user_id) {
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

  revalidateParentPaths(phoneNormalized);
  return { success: "Compte parent désactivé." };
}

export async function updateParent(
  _prevState: ParentFormState,
  formData: FormData,
): Promise<ParentFormState> {
  await requireAdmin();
  const supabase = await createClient();
  const admin = createAdminClient();

  const oldPhone = String(formData.get("phone_normalized") ?? "").trim();
  const newPhone = normalizePhone(String(formData.get("phone") ?? ""));
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!oldPhone || !newPhone || !fullName) {
    return { error: "Remplissez tous les champs obligatoires." };
  }

  const { data: existing } = await supabase
    .from("phone_registry")
    .select(
      "phone_normalized, linked_user_id, role, full_name, player_id",
    )
    .eq("phone_normalized", oldPhone)
    .maybeSingle();

  if (!existing || existing.role !== "parent") {
    return { error: "Parent introuvable." };
  }

  if (newPhone === oldPhone) {
    const { error } = await supabase
      .from("phone_registry")
      .update({ full_name: fullName })
      .eq("phone_normalized", oldPhone);

    if (error) {
      return { error: "Impossible de modifier ce parent." };
    }

    if (existing.linked_user_id) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.linked_user_id);
    }

    await syncLinkedPlayers(supabase, oldPhone, oldPhone, fullName);
    revalidateParentPaths(oldPhone);
    return { success: `${fullName} mis à jour.` };
  }

  if (isProtectedMemberPhone(oldPhone)) {
    return {
      error: "Le numéro de ce compte ne peut pas être modifié.",
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
    role: "parent",
    full_name: fullName,
    player_id: existing.player_id,
    linked_user_id: existing.linked_user_id,
  });

  if (insertError) {
    return { error: "Impossible de mettre à jour le numéro de téléphone." };
  }

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

  await syncLinkedPlayers(supabase, oldPhone, newPhone, fullName);
  revalidateParentPaths(oldPhone, newPhone);

  const newKey = buildParentKey(newPhone);
  return {
    success: `${fullName} mis à jour avec le nouveau numéro.`,
    redirectTo: newKey ? `/dashboard/parents/${newKey}?tab=fiche` : undefined,
  };
}

export async function deleteParent(
  phoneNormalized: string,
): Promise<ParentFormState> {
  await requireAdmin();

  if (isProtectedMemberPhone(phoneNormalized)) {
    return { error: "Ce compte ne peut pas être supprimé." };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: entry } = await supabase
    .from("phone_registry")
    .select("linked_user_id, full_name, role")
    .eq("phone_normalized", phoneNormalized)
    .maybeSingle();

  if (!entry || entry.role !== "parent") {
    return { error: "Parent introuvable." };
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

  revalidateParentPaths(phoneNormalized);
  return {
    success: `${entry.full_name ?? "Parent"} retiré du registre.`,
  };
}

export async function deleteParentByKey(
  parentKey: string,
): Promise<ParentFormState> {
  await requireAdmin();
  const parsed = parseParentKey(parentKey);
  if (parsed.type !== "phone") {
    return {
      error:
        "Ce profil est lié à un membre staff. Modifiez-le depuis Agents.",
    };
  }
  return deleteParent(parsed.value);
}
