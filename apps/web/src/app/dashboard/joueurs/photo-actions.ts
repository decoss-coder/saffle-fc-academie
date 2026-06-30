"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canUploadDocuments, canManagePlayers } from "@/lib/auth";
import { PLAYER_PHOTOS_BUCKET } from "@/lib/players/photos";

export type PhotoActionState = {
  error?: string;
  success?: string;
};

export async function registerPlayerPhoto(
  _prev: PhotoActionState,
  formData: FormData,
): Promise<PhotoActionState> {
  const { profile } = await requireUser();
  if (!canUploadDocuments(profile.role) && !canManagePlayers(profile.role)) {
    return { error: "Vous n'avez pas la permission de modifier la photo." };
  }

  const playerId = String(formData.get("player_id") ?? "").trim();
  const photoPath = String(formData.get("photo_path") ?? "").trim();

  if (!playerId || !photoPath) {
    return { error: "Photo incomplète." };
  }

  if (!photoPath.startsWith(`${playerId}/`)) {
    return { error: "Chemin photo invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_player_photo", {
    p_player_id: playerId,
    p_photo_path: photoPath,
  });

  if (error) {
    return { error: "Impossible d'enregistrer la photo de profil." };
  }

  revalidatePath("/dashboard/mes-documents");
  revalidatePath(`/dashboard/joueurs/${playerId}`);
  revalidatePath("/dashboard/joueurs");
  revalidatePath("/dashboard/parent");
  revalidatePath(`/dashboard/joueurs/${playerId}/modifier`);
  return { success: "Photo de profil enregistrée." };
}

export async function getPlayerPhotoSignedUrl(photoPath: string | null | undefined) {
  if (!photoPath) return null;

  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(PLAYER_PHOTOS_BUCKET)
    .createSignedUrl(photoPath, 3600);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
