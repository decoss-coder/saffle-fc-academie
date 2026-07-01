"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, requireTreasurer, requireUser } from "@/lib/auth";
import { notifyPlayerStakeholders } from "@/lib/notifications/actions";
import { PLAYER_GROUPS } from "@/lib/players/constants";

export type ClubFormState = { error?: string; success?: string };

function text(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function saveTrainingSchedule(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const team = text(formData.get("team"));
  const day = Number(formData.get("day_of_week"));
  const start = text(formData.get("start_time"));
  const end = text(formData.get("end_time"));
  const location = text(formData.get("location")) || null;

  if (!team || !start || !end || Number.isNaN(day)) {
    return { error: "Champs obligatoires manquants." };
  }

  const { error } = await supabase.from("training_schedules").insert({
    team,
    day_of_week: day,
    start_time: start,
    end_time: end,
    location,
  });

  if (error) return { error: "Impossible d'enregistrer le créneau." };
  revalidatePath("/dashboard/club/planning");
  return { success: "Créneau d'entraînement ajouté." };
}

export async function updateTrainingSchedule(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();

  const scheduleId = text(formData.get("schedule_id"));
  const day = Number(formData.get("day_of_week"));
  const start = text(formData.get("start_time"));
  const end = text(formData.get("end_time"));
  const location = text(formData.get("location")) || null;

  if (!scheduleId || !start || !end || Number.isNaN(day)) {
    return { error: "Champs obligatoires manquants." };
  }

  const { error } = await supabase
    .from("training_schedules")
    .update({
      day_of_week: day,
      start_time: start,
      end_time: end,
      location,
    })
    .eq("id", scheduleId);

  if (error) return { error: "Modification impossible." };
  revalidatePath("/dashboard/club/planning");
  return { success: "Créneau mis à jour." };
}

export async function deleteTrainingSchedule(
  scheduleId: string,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();

  if (!scheduleId) return { error: "Créneau introuvable." };

  const { error } = await supabase
    .from("training_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) return { error: "Suppression impossible." };
  revalidatePath("/dashboard/club/planning");
  return { success: "Créneau supprimé." };
}

export async function updateTrainingTarget(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const team = text(formData.get("team"));
  const minHours = Number(formData.get("min_hours_per_week"));
  const championshipDate = text(formData.get("championship_date")) || null;

  if (!team || minHours <= 0) return { error: "Groupe et heures min requis." };

  const { error } = await supabase.from("team_training_targets").upsert({
    team,
    min_hours_per_week: minHours,
    championship_date: championshipDate,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "Mise à jour impossible." };
  revalidatePath("/dashboard/club/planning");
  return { success: `Objectif ${team} mis à jour.` };
}

export async function savePlayerEquipment(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const playerId = text(formData.get("player_id"));
  if (!playerId) return { error: "Joueur requis." };

  const { error } = await supabase.from("player_equipment").upsert({
    player_id: playerId,
    jersey_status: text(formData.get("jersey_status")) || "ok",
    shorts_status: text(formData.get("shorts_status")) || "ok",
    socks_status: text(formData.get("socks_status")) || "ok",
    shin_guards_status: text(formData.get("shin_guards_status")) || "ok",
    shoe_size: text(formData.get("shoe_size")) || null,
    shoe_loaned: formData.get("shoe_loaned") === "on",
    notes: text(formData.get("notes")) || null,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: "Enregistrement équipement impossible." };
  revalidatePath("/dashboard/club/equipement");
  revalidatePath(`/dashboard/joueurs/${playerId}`);
  return { success: "Équipement enregistré." };
}

export async function addInventoryItem(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("equipment_inventory").insert({
    item_type: text(formData.get("item_type")) || "shoes",
    label: text(formData.get("label")),
    size: text(formData.get("size")) || null,
    team: text(formData.get("team")) || null,
  });
  if (error || !text(formData.get("label"))) {
    return { error: "Libellé requis." };
  }
  revalidatePath("/dashboard/club/equipement");
  return { success: "Article ajouté à l'inventaire." };
}

export async function loanEquipment(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const itemId = text(formData.get("item_id"));
  const playerId = text(formData.get("player_id"));
  if (!itemId || !playerId) return { error: "Article et joueur requis." };

  await supabase.from("equipment_loans").insert({
    item_id: itemId,
    player_id: playerId,
    due_at: text(formData.get("due_at")) || null,
  });
  await supabase
    .from("equipment_inventory")
    .update({ status: "loaned" })
    .eq("id", itemId);

  revalidatePath("/dashboard/club/equipement");
  return { success: "Prêt enregistré." };
}

export async function addDisciplineRecord(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  const { user } = await requireStaff();
  const supabase = await createClient();
  const playerId = text(formData.get("player_id"));
  const incidentType = text(formData.get("incident_type"));
  const description = text(formData.get("description"));
  const newStatus = text(formData.get("discipline_status"));

  if (!playerId || !description) return { error: "Joueur et description requis." };

  await supabase.from("player_discipline_records").insert({
    player_id: playerId,
    incident_type: incidentType || "warning",
    description,
    created_by: user.id,
  });

  if (newStatus) {
    await supabase
      .from("players")
      .update({ discipline_status: newStatus })
      .eq("id", playerId);
  }

  if (incidentType === "encouragement") {
    await notifyPlayerStakeholders({
      playerId,
      type: "general",
      title: "Mot d'encouragement",
      body: description,
      link: `/dashboard/joueurs/${playerId}`,
      excludeUserId: user.id,
    });
  }

  revalidatePath("/dashboard/club/discipline");
  revalidatePath(`/dashboard/joueurs/${playerId}`);
  return { success: "Enregistrement discipline ajouté." };
}

export async function checkAbsenceThreshold(playerId: string, playerName: string) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: entries } = await supabase
    .from("convocation_entries")
    .select("response, convocations!inner(event_type, event_date)")
    .eq("player_id", playerId)
    .in("response", ["absent", "declined"])
    .gte("convocations.event_date", since.toISOString());

  const count = entries?.length ?? 0;
  if (count < 3) return;

  const { data: existing } = await supabase
    .from("player_discipline_records")
    .select("id")
    .eq("player_id", playerId)
    .eq("incident_type", "warning")
    .gte("created_at", since.toISOString())
    .limit(1);

  if (existing?.length) return;

  await supabase.from("player_discipline_records").insert({
    player_id: playerId,
    incident_type: "warning",
    description: `${count} absences/déclins sur les 30 derniers jours — seuil atteint (doc. encadrement).`,
  });
  await supabase
    .from("players")
    .update({ discipline_status: "warning" })
    .eq("id", playerId);

  await notifyPlayerStakeholders({
    playerId,
    type: "absence",
    title: `Discipline — ${playerName}`,
    body: `Seuil d'absences atteint (${count} sur 30 jours). Contactez le club.`,
    link: `/dashboard/joueurs/${playerId}/presences`,
  });
}

export async function saveMedicalInfo(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const playerId = text(formData.get("player_id"));
  if (!playerId) return { error: "Joueur requis." };

  const { error } = await supabase
    .from("players")
    .update({
      insurance_provider: text(formData.get("insurance_provider")) || null,
      insurance_number: text(formData.get("insurance_number")) || null,
      medical_cert_expires_at: text(formData.get("medical_cert_expires_at")) || null,
      team_doctor_contact: text(formData.get("team_doctor_contact")) || null,
    })
    .eq("id", playerId);

  if (error) return { error: "Mise à jour médicale impossible." };
  revalidatePath("/dashboard/club/medical");
  revalidatePath(`/dashboard/joueurs/${playerId}`);
  return { success: "Informations médicales enregistrées." };
}

export async function createMatchWithBonuses(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();
  const team = text(formData.get("team"));
  const title = text(formData.get("title"));
  const opponent = text(formData.get("opponent")) || null;
  const matchDate = text(formData.get("match_date"));
  const bonusAmount = Number(formData.get("bonus_amount"));
  const isVictory = formData.get("is_victory") === "on";
  const scoreHome = Number(formData.get("score_home") || 0);
  const scoreAway = Number(formData.get("score_away") || 0);

  if (!team || !title || !matchDate || bonusAmount <= 0) {
    return { error: "Groupe, titre, date et prime requis." };
  }

  const { data: match, error } = await supabase
    .from("club_matches")
    .insert({
      team,
      title,
      opponent,
      match_date: new Date(matchDate).toISOString(),
      is_victory: isVictory,
      bonus_amount: bonusAmount,
      score_home: scoreHome,
      score_away: scoreAway,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !match) return { error: "Match impossible à créer." };

  if (isVictory) {
    const { data: players } = await supabase
      .from("players")
      .select("id")
      .eq("team", team)
      .eq("is_archived", false);

    if (players?.length) {
      await supabase.from("match_player_bonuses").insert(
        players.map((p) => ({
          match_id: match.id,
          player_id: p.id,
          amount: bonusAmount,
        })),
      );
    }
  }

  revalidatePath("/dashboard/club/matchs");
  return {
    success: isVictory
      ? `Match enregistré — primes ${bonusAmount} FCFA pour ${team}.`
      : "Match enregistré.",
  };
}

export async function createProfitSharing(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();
  const team = text(formData.get("team"));
  const label = text(formData.get("label"));
  const total = Number(formData.get("total_amount"));

  if (!team || !label || total <= 0) {
    return { error: "Groupe, libellé et montant requis." };
  }

  const { data: players } = await supabase
    .from("players")
    .select("id")
    .eq("team", team)
    .eq("is_archived", false);

  const count = players?.length ?? 0;
  const perPlayer = count > 0 ? Math.floor(total / count) : 0;

  const { error } = await supabase.from("profit_sharing_pools").insert({
    team,
    label,
    total_amount: total,
    per_player_amount: perPlayer,
    status: "draft",
    created_by: user.id,
  });

  if (error) return { error: "Intéressement impossible à créer." };
  revalidatePath("/dashboard/club/interessement");
  return {
    success: `Intéressement créé — ${perPlayer} FCFA/joueur (${count} joueurs).`,
  };
}

export async function submitWelfareRequest(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  const { user } = await requireUser();
  const supabase = await createClient();
  const playerId = text(formData.get("player_id"));
  const requestType = text(formData.get("request_type"));
  const description = text(formData.get("description"));

  if (!playerId || !description) {
    return { error: "Joueur et description requis." };
  }

  const { error } = await supabase.from("welfare_requests").insert({
    player_id: playerId,
    request_type: requestType || "other",
    description,
    submitted_by: user.id,
  });

  if (error) return { error: "Demande impossible." };
  revalidatePath("/dashboard/club/aides");
  return { success: "Demande envoyée au bureau (confidentiel)." };
}

export async function reviewWelfareRequest(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const id = text(formData.get("request_id"));
  const status = text(formData.get("status"));
  const adminNote = text(formData.get("admin_note")) || null;

  const { error } = await supabase
    .from("welfare_requests")
    .update({ status, admin_note: adminNote, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Mise à jour impossible." };
  revalidatePath("/dashboard/club/aides");
  return { success: "Demande mise à jour." };
}

export async function addLogisticsTask(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  const { user } = await requireStaff();
  const supabase = await createClient();
  const title = text(formData.get("title"));
  if (!title) return { error: "Titre requis." };

  const { error } = await supabase.from("logistics_tasks").insert({
    title,
    category: text(formData.get("category")) || "other",
    scheduled_for: text(formData.get("scheduled_for")) || null,
    notes: text(formData.get("notes")) || null,
    created_by: user.id,
  });

  if (error) return { error: "Tâche impossible à créer." };
  revalidatePath("/dashboard/club/logistique");
  return { success: "Tâche logistique ajoutée." };
}

export async function updateLogisticsStatus(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("logistics_tasks")
    .update({ status: text(formData.get("status")) })
    .eq("id", text(formData.get("id")));

  if (error) return { error: "Mise à jour impossible." };
  revalidatePath("/dashboard/club/logistique");
  return { success: "Tâche mise à jour." };
}

export async function submitTransportRequest(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  const { user } = await requireUser();
  const supabase = await createClient();
  const playerId = text(formData.get("player_id"));
  const description = text(formData.get("description"));
  if (!playerId || !description) return { error: "Champs requis." };

  const { error } = await supabase.from("transport_requests").insert({
    player_id: playerId,
    description,
    submitted_by: user.id,
  });

  if (error) return { error: "Demande transport impossible." };
  revalidatePath("/dashboard/club/transport");
  return { success: "Demande de transport envoyée." };
}

export async function updateTransportStatus(
  _prev: ClubFormState,
  formData: FormData,
): Promise<ClubFormState> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("transport_requests")
    .update({ status: text(formData.get("status")) })
    .eq("id", text(formData.get("request_id")));

  if (error) return { error: "Mise à jour impossible." };
  revalidatePath("/dashboard/club/transport");
  return { success: "Statut transport mis à jour." };
}

export async function reviewWelfareRequestForm(formData: FormData) {
  await reviewWelfareRequest({}, formData);
}

export async function updateLogisticsStatusForm(formData: FormData) {
  await updateLogisticsStatus({}, formData);
}

export async function updateTransportStatusForm(formData: FormData) {
  await updateTransportStatus({}, formData);
}
