"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import type { PlayerCategory } from "@/lib/players/constants";
import { PLAYER_GROUPS as GROUPS } from "@/lib/players/constants";

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

export async function createPlayer(
  _prevState: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  await requireStaff();
  const supabase = await createClient();

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
    return { error: "Remplissez tous les champs obligatoires." };
  }

  const matricule = await generateMatricule(supabase);

  const { data, error } = await supabase
    .from("players")
    .insert({
      matricule,
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
      gender,
      category,
      team: teamGroup,
      father_name: String(formData.get("father_name") ?? "").trim() || null,
      mother_name: String(formData.get("mother_name") ?? "").trim() || null,
      guardian_name: String(formData.get("guardian_name") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      strong_foot: String(formData.get("strong_foot") ?? "").trim() || null,
      primary_position:
        String(formData.get("primary_position") ?? "").trim() || null,
      secondary_position:
        String(formData.get("secondary_position") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Impossible d'enregistrer le joueur. Vérifiez Supabase." };
  }

  revalidatePath("/dashboard/joueurs");
  redirect(`/dashboard/joueurs/${data.id}`);
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
