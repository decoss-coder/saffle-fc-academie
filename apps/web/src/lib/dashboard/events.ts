import type { SupabaseClient } from "@supabase/supabase-js";
import { formatEventType } from "@/lib/convocations/constants";
import { unwrapRelation } from "@/lib/supabase/relation";
import { canManageConvocations } from "@/lib/auth";

export type UpcomingEvent = {
  id: string;
  title: string;
  eventTypeLabel: string;
  eventDate: string;
  location: string | null;
  invited: number;
  responded: number;
  pending: number;
  href: string;
  subtitle?: string;
};

type ConvocationRow = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  location: string | null;
};

function aggregateEntries(
  convocation: ConvocationRow,
  entries: Array<{ convocation_id: string; response: string }>,
): UpcomingEvent {
  const related = entries.filter((e) => e.convocation_id === convocation.id);
  const invited = related.length;
  const pending = related.filter((e) => e.response === "pending").length;
  const responded = invited - pending;

  return {
    id: convocation.id,
    title: convocation.title,
    eventTypeLabel: formatEventType(convocation.event_type),
    eventDate: convocation.event_date,
    location: convocation.location,
    invited,
    responded,
    pending,
    href: `/dashboard/convocations/${convocation.id}`,
  };
}

export async function fetchStaffUpcomingEvents(
  supabase: SupabaseClient,
  role: string,
): Promise<UpcomingEvent[]> {
  if (!canManageConvocations(role)) return [];

  const now = new Date().toISOString();
  const { data: convocations } = await supabase
    .from("convocations")
    .select("id, title, event_type, event_date, location")
    .gte("event_date", now)
    .order("event_date", { ascending: true })
    .limit(3);

  if (!convocations?.length) return [];

  const ids = convocations.map((c) => c.id);
  const { data: entries } = await supabase
    .from("convocation_entries")
    .select("convocation_id, response")
    .in("convocation_id", ids);

  return convocations.map((convocation) =>
    aggregateEntries(convocation, entries ?? []),
  );
}

export async function fetchParentUpcomingEvents(
  supabase: SupabaseClient,
  playerIds: string[],
): Promise<UpcomingEvent[]> {
  if (!playerIds.length) return [];

  const now = Date.now();
  const { data: entries } = await supabase
    .from("convocation_entries")
    .select(
      `
      id, response,
      players ( first_name, last_name ),
      convocations ( id, title, event_type, event_date, location )
    `,
    )
    .in("player_id", playerIds);

  const upcoming = (entries ?? [])
    .map((entry) => {
      const convocation = unwrapRelation(entry.convocations);
      const player = unwrapRelation(entry.players);
      if (!convocation || !player) return null;
      if (new Date(convocation.event_date).getTime() < now) return null;

      const playerName = `${player.first_name} ${player.last_name}`;
      const responseLabel =
        entry.response === "pending" ? "À répondre" : "Répondu";

      return {
        id: entry.id,
        title: convocation.title,
        eventTypeLabel: formatEventType(convocation.event_type),
        eventDate: convocation.event_date,
        location: convocation.location,
        invited: 1,
        responded: entry.response === "pending" ? 0 : 1,
        pending: entry.response === "pending" ? 1 : 0,
        href: "/dashboard/parent/convocations",
        subtitle: `${playerName} · ${responseLabel}`,
        sortKey: convocation.event_date,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(0, 3)
    .map(({ sortKey: _sortKey, ...event }) => event);

  return upcoming;
}
