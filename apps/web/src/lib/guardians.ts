import { createClient } from "@/lib/supabase/server";

export async function getLinkedPlayerIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: guardians } = await supabase
    .from("player_guardians")
    .select("player_id")
    .eq("guardian_id", userId);

  const { data: ownPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("user_id", userId)
    .eq("is_archived", false);

  const ids = new Set<string>();
  guardians?.forEach((g) => ids.add(g.player_id));
  ownPlayers?.forEach((p) => ids.add(p.id));
  return [...ids];
}
