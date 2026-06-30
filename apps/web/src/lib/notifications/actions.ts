"use server";

import { createClient } from "@/lib/supabase/server";

type NotifyParams = {
  playerId: string;
  type: "absence" | "late" | "performance" | "payment_overdue" | "general";
  title: string;
  body: string;
  link?: string;
  excludeUserId?: string;
};

export async function notifyPlayerStakeholders(params: NotifyParams) {
  const supabase = await createClient();

  await supabase.rpc("create_player_notifications", {
    p_player_id: params.playerId,
    p_type: params.type,
    p_title: params.title,
    p_body: params.body,
    p_link: params.link ?? null,
    p_exclude_user_id: params.excludeUserId ?? null,
  });
}

export async function notifyUser(params: {
  userId: string;
  type: "absence" | "late" | "performance" | "payment_overdue" | "general";
  title: string;
  body: string;
  link?: string;
}) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link ?? null,
  });
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
}
