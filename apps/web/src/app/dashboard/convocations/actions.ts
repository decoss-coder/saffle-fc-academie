"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireConvocationStaff, requireUser } from "@/lib/auth";
import { checkAbsenceThreshold } from "@/app/dashboard/club/actions";
import { notifyPlayerStakeholders } from "@/lib/notifications/actions";
import { unwrapRelation } from "@/lib/supabase/relation";

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
    .select("id, event_type, title, event_date")
    .eq("id", convocationId)
    .maybeSingle();

  if (!convocation || convocation.event_type !== "training") {
    return { error: "Cette convocation n'est pas un entraînement." };
  }

  const { data: entries } = await supabase
    .from("convocation_entries")
    .select(
      `
      id, response, performance_level, player_id,
      players ( first_name, last_name )
    `,
    )
    .eq("convocation_id", convocationId);

  const allowed = new Set([
    "pending",
    "confirmed",
    "declined",
    "late",
    "absent",
  ]);
  const allowedPerformance = new Set([
    "excellent",
    "satisfactory",
    "needs_improvement",
  ]);

  const sessionDate = new Intl.DateTimeFormat("fr-CI", {
    day: "2-digit",
    month: "long",
  }).format(new Date(convocation.event_date));

  for (const entry of entries ?? []) {
    const response = String(formData.get(`response_${entry.id}`) ?? "").trim();
    const performanceRaw = String(
      formData.get(`performance_${entry.id}`) ?? "",
    ).trim();
    const performance = allowedPerformance.has(performanceRaw)
      ? performanceRaw
      : null;

    if (!response || !allowed.has(response)) continue;

    const player = unwrapRelation(entry.players);
    const playerName = player
      ? `${player.last_name} ${player.first_name}`
      : "Joueur";

    const { error } = await supabase
      .from("convocation_entries")
      .update({
        response,
        performance_level: performance,
        responded_at: new Date().toISOString(),
        responded_by: user.id,
      })
      .eq("id", entry.id);

    if (error) {
      return { error: "Impossible d'enregistrer les présences." };
    }

    const presencesLink = `/dashboard/joueurs/${entry.player_id}/presences`;

    if (response === "absent" && entry.response !== "absent") {
      await notifyPlayerStakeholders({
        playerId: entry.player_id,
        type: "absence",
        title: `Absence — ${playerName}`,
        body: `${playerName} a été marqué absent à l'entraînement « ${convocation.title} » (${sessionDate}).`,
        link: presencesLink,
        excludeUserId: user.id,
      });
      await checkAbsenceThreshold(entry.player_id, playerName);
    }

    if (response === "late" && entry.response !== "late") {
      await notifyPlayerStakeholders({
        playerId: entry.player_id,
        type: "late",
        title: `Retard — ${playerName}`,
        body: `${playerName} a été marqué en retard à l'entraînement « ${convocation.title} » (${sessionDate}).`,
        link: presencesLink,
        excludeUserId: user.id,
      });
    }

    if (
      performance === "needs_improvement" &&
      entry.performance_level !== "needs_improvement"
    ) {
      await notifyPlayerStakeholders({
        playerId: entry.player_id,
        type: "performance",
        title: `Performance à améliorer — ${playerName}`,
        body: `Le coach a indiqué que la performance de ${playerName} doit être améliorée lors de « ${convocation.title} » (${sessionDate}).`,
        link: presencesLink,
        excludeUserId: user.id,
      });
    }

    if (
      performance === "excellent" &&
      entry.performance_level !== "excellent"
    ) {
      await notifyPlayerStakeholders({
        playerId: entry.player_id,
        type: "performance",
        title: `Belle performance — ${playerName}`,
        body: `${playerName} a eu une excellente performance à l'entraînement « ${convocation.title} » (${sessionDate}).`,
        link: presencesLink,
        excludeUserId: user.id,
      });
    }
  }

  revalidatePath(`/dashboard/convocations/${convocationId}`);
  revalidatePath("/dashboard/joueurs");
  revalidatePath("/dashboard/notifications");
  return { success: "Présences enregistrées. Notifications envoyées si nécessaire." };
}
