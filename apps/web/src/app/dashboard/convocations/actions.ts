"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConvocationStaff, requireUser } from "@/lib/auth";

export type ConvocationFormState = { error?: string; success?: string };

export async function createConvocation(
  _prev: ConvocationFormState,
  formData: FormData,
): Promise<ConvocationFormState> {
  const { user } = await requireConvocationStaff();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const eventType = String(formData.get("event_type") ?? "training");
  const eventDate = String(formData.get("event_date") ?? "");
  const eventTime = String(formData.get("event_time") ?? "09:00");
  const location = String(formData.get("location") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const playerIds = formData.getAll("player_ids").map(String).filter(Boolean);

  if (!title || !eventDate || playerIds.length === 0) {
    return { error: "Titre, date et au moins un joueur requis." };
  }

  const eventDateTime = new Date(`${eventDate}T${eventTime}:00`).toISOString();

  const { data: convocation, error } = await supabase
    .from("convocations")
    .insert({
      title,
      event_type: eventType,
      event_date: eventDateTime,
      location,
      notes,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !convocation) {
    return { error: "Impossible de créer la convocation." };
  }

  const entries = playerIds.map((playerId) => ({
    convocation_id: convocation.id,
    player_id: playerId,
  }));

  await supabase.from("convocation_entries").insert(entries);

  revalidatePath("/dashboard/convocations");
  revalidatePath("/dashboard/parent/convocations");
  redirect(`/dashboard/convocations/${convocation.id}`);
}

export async function respondConvocation(
  _prev: ConvocationFormState,
  formData: FormData,
): Promise<ConvocationFormState> {
  await requireUser();
  const supabase = await createClient();

  const entryId = String(formData.get("entry_id") ?? "");
  const response = String(formData.get("response") ?? "");
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!entryId || !response) {
    return { error: "Réponse requise." };
  }

  const { error } = await supabase.rpc("respond_convocation", {
    p_entry_id: entryId,
    p_response: response,
    p_comment: comment,
  });

  if (error) {
    return { error: "Impossible d'enregistrer votre réponse." };
  }

  revalidatePath("/dashboard/parent/convocations");
  revalidatePath("/dashboard/parent");
  revalidatePath("/dashboard/convocations");
  return { success: "Réponse enregistrée." };
}
