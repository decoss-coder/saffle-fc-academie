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
  revalidatePath("/dashboard/joueurs");
  return { success: "Réponse enregistrée." };
}

export async function updateConvocationAttendance(
  _prev: ConvocationFormState,
  formData: FormData,
): Promise<ConvocationFormState> {
  const { user } = await requireConvocationStaff();
  const supabase = await createClient();

  const convocationId = String(formData.get("convocation_id") ?? "").trim();
  if (!convocationId) {
    return { error: "Convocation introuvable." };
  }

  const { data: convocation } = await supabase
    .from("convocations")
    .select("id, event_type")
    .eq("id", convocationId)
    .maybeSingle();

  if (!convocation || convocation.event_type !== "training") {
    return { error: "Cette convocation n'est pas un entraînement." };
  }

  const { data: entries } = await supabase
    .from("convocation_entries")
    .select("id")
    .eq("convocation_id", convocationId);

  const allowed = new Set([
    "pending",
    "confirmed",
    "declined",
    "late",
    "absent",
  ]);

  for (const entry of entries ?? []) {
    const response = String(formData.get(`response_${entry.id}`) ?? "").trim();
    if (!response || !allowed.has(response)) continue;

    const { error } = await supabase
      .from("convocation_entries")
      .update({
        response,
        responded_at: new Date().toISOString(),
        responded_by: user.id,
      })
      .eq("id", entry.id);

    if (error) {
      return { error: "Impossible d'enregistrer les présences." };
    }
  }

  revalidatePath(`/dashboard/convocations/${convocationId}`);
  revalidatePath("/dashboard/joueurs");
  return { success: "Présences enregistrées." };
}
