"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { PlayerCategory } from "@/lib/players/constants";
import { PLAYER_GROUPS as GROUPS } from "@/lib/players/constants";
import { DEFAULT_COUNTRY } from "@/lib/players/countries";
import type { PostgrestError } from "@supabase/supabase-js";

export type PlayerFormState = {
  error?: string;
  success?: string;
};

function mapPlayerDbError(error: PostgrestError): string {
  if (error.code === "42703") {
    return "Schéma base incomplet : exécutez les migrations Supabase (champs fédération joueur).";
  }
  if (error.code === "23505") {
    return "Matricule ou donnée en doublon. Réessayez dans quelques secondes.";
  }
  if (error.code === "42501") {
    return "Droits insuffisants pour créer un joueur.";
  }
  if (
    error.message.includes("ON CONFLICT") ||
    error.message.includes("phone_registry")
  ) {
    return "Ce numéro est déjà lié à un autre compte. Laissez le téléphone vide ou utilisez un autre numéro.";
  }
  if (error.code === "PGRST116") {
    return "Joueur enregistré mais inaccessible (politique RLS). Contactez l'administrateur.";
  }
  return `Impossible d'enregistrer le joueur : ${error.message}`;
}

async function generateMatricule(supabase: Awaited<ReturnType<typeof createClient>>) {
  const year = new Date().getFullYear();
  const prefix = `SFA-${year}-`;

  const { data: last } = await supabase
    .from("players")
    .select("matricule")
    .like("matricule", `${prefix}%`)
    .order("matricule", { ascending: false })
    .limit(1)
    .maybeSingle();

  let counter = 1;
  if (last?.matricule) {
    const suffix = last.matricule.slice(prefix.length);
    const parsed = Number.parseInt(suffix, 10);
    if (Number.isFinite(parsed)) {
      counter = parsed + 1;
    }
  }

  let matricule = `${prefix}${String(counter).padStart(3, "0")}`;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data: existing } = await supabase
      .from("players")
      .select("id")
      .eq("matricule", matricule)
      .maybeSingle();

    if (!existing) return matricule;
    counter += 1;
    matricule = `${prefix}${String(counter).padStart(3, "0")}`;
  }

  return matricule;
}

async function ensureParentPhoneAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: string,
) {
  const { data, error } = await supabase.rpc("ensure_parent_phone_for_player", {
    p_player_id: playerId,
  });

  if (error) {
    console.error("[ensureParentPhoneAccess]", error.message);
    return { ok: false as const, reason: "rpc_error" };
  }

  const result = data as {
    ok?: boolean;
    reason?: string;
    phone?: string;
    activated?: boolean;
  };

  if (!result?.ok) {
    return { ok: false as const, reason: result?.reason ?? "unknown" };
  }

  return { ok: true as const, phone: result.phone, activated: result.activated };
}

function parentPhoneWarning(reason: string | undefined) {
  if (reason === "phone_is_staff") {
    return "Joueur enregistré, mais ce numéro appartient à un membre staff — le parent ne pourra pas l'utiliser pour /activer.";
  }
  return null;
}

function optionalText(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function parsePlayerPayload(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "");
  const gender = String(formData.get("gender") ?? "");
  const teamGroup = String(formData.get("team_group") ?? "").trim();
  const groupDef = GROUPS.find((g) => g.team === teamGroup);
  let category = String(formData.get("category") ?? "") as PlayerCategory;
  if (!category && groupDef) {
    category = groupDef.category;
  }

  if (!firstName || !lastName || !birthDate || !gender || !category || !teamGroup) {
    return { error: "Remplissez tous les champs obligatoires." as const };
  }

  return {
    payload: {
      first_name: firstName,
      last_name: lastName,
      birth_name: optionalText(formData.get("birth_name")),
      birth_date: birthDate,
      gender,
      category,
      team: teamGroup,
      nationality: optionalText(formData.get("nationality")) ?? DEFAULT_COUNTRY,
      secondary_nationality: optionalText(formData.get("secondary_nationality")),
      birth_country: optionalText(formData.get("birth_country")) ?? DEFAULT_COUNTRY,
      birth_region: optionalText(formData.get("birth_region")),
      birth_city: optionalText(formData.get("birth_city")),
      father_name: optionalText(formData.get("father_name")),
      mother_name: optionalText(formData.get("mother_name")),
      guardian_name: optionalText(formData.get("guardian_name")),
      address: optionalText(formData.get("address")),
      phone: optionalText(formData.get("phone")),
      height_cm: optionalNumber(formData.get("height_cm")),
      weight_kg: optionalNumber(formData.get("weight_kg")),
      strong_foot: optionalText(formData.get("strong_foot")),
      primary_position: optionalText(formData.get("primary_position")),
      secondary_position: optionalText(formData.get("secondary_position")),
      birth_certificate_ref: optionalText(formData.get("birth_certificate_ref")),
      former_license_number: optionalText(formData.get("former_license_number")),
    },
  };
}

export async function createPlayer(
  _prevState: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  await requireStaff();
  const supabase = await createClient();

  const parsed = parsePlayerPayload(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const matricule = await generateMatricule(supabase);

  const { data, error } = await supabase
    .from("players")
    .insert({ matricule, ...parsed.payload })
    .select("id");

  if (error) {
    console.error("[createPlayer]", error.code, error.message, error.details);
    return { error: mapPlayerDbError(error) };
  }

  const playerId = data?.[0]?.id;
  if (!playerId) {
    return {
      error:
        "Joueur peut-être créé mais introuvable. Vérifiez la liste des joueurs.",
    };
  }

  let parentWarning: string | null = null;
  if (parsed.payload.phone) {
    const parentAccess = await ensureParentPhoneAccess(supabase, playerId);
    parentWarning = parentPhoneWarning(parentAccess.ok ? undefined : parentAccess.reason);
  }

  revalidatePath("/dashboard/joueurs");
  if (parentWarning) {
    redirect(
      `/dashboard/joueurs/${playerId}?parent_warning=${encodeURIComponent(parentWarning)}`,
    );
  }
  redirect(`/dashboard/joueurs/${playerId}?parent_ready=1`);
}

export async function updatePlayer(
  _prevState: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const playerId = String(formData.get("player_id") ?? "").trim();
  if (!playerId) {
    return { error: "Joueur introuvable." };
  }

  await requireStaff();
  const supabase = await createClient();

  const parsed = parsePlayerPayload(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { error } = await supabase
    .from("players")
    .update(parsed.payload)
    .eq("id", playerId);

  if (error) {
    console.error("[updatePlayer]", error.code, error.message, error.details);
    return { error: mapPlayerDbError(error) };
  }

  if (parsed.payload.phone) {
    await ensureParentPhoneAccess(supabase, playerId);
  }

  revalidatePath("/dashboard/joueurs");
  revalidatePath(`/dashboard/joueurs/${playerId}`);
  revalidatePath(`/dashboard/joueurs/${playerId}/modifier`);
  redirect(`/dashboard/joueurs/${playerId}`);
}

export async function archivePlayer(formData: FormData): Promise<void> {
  const playerId = String(formData.get("player_id") ?? "");
  if (!playerId) return;

  await requireStaff();
  const supabase = await createClient();

  await supabase
    .from("players")
    .update({ is_archived: true })
    .eq("id", playerId);

  revalidatePath("/dashboard/joueurs");
  revalidatePath(`/dashboard/joueurs/${playerId}`);
  redirect("/dashboard/joueurs");
}
