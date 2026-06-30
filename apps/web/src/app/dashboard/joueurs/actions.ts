"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { PlayerCategory } from "@/lib/players/constants";
import { PLAYER_GROUPS as GROUPS } from "@/lib/players/constants";
import { DEFAULT_COUNTRY } from "@/lib/players/countries";

export type PlayerFormState = {
  error?: string;
  success?: string;
};

async function generateMatricule(supabase: Awaited<ReturnType<typeof createClient>>) {
  const year = new Date().getFullYear();
  const prefix = `SFA-${year}-`;

  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .like("matricule", `${prefix}%`);

  const next = String((count ?? 0) + 1).padStart(3, "0");
  return `${prefix}${next}`;
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
    .select("id")
    .single();

  if (error) {
    return { error: "Impossible d'enregistrer le joueur. Vérifiez Supabase." };
  }

  revalidatePath("/dashboard/joueurs");
  redirect(`/dashboard/joueurs/${data.id}`);
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
    return { error: "Impossible de mettre à jour le joueur. Vérifiez Supabase." };
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
