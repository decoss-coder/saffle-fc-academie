import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { unwrapRelation } from "@/lib/supabase/relation";

export type ParentDirectoryEntry = {
  key: string;
  phone: string;
  displayName: string;
  activated: boolean;
  guardianUserId: string | null;
  accountRole: string | null;
  isStaffGuardian: boolean;
  childrenCount: number;
  openDuesCount: number;
  pendingConvocationsCount: number;
};

export type ParentChild = {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  category: string;
  team: string | null;
  guardian_name: string | null;
  father_name: string | null;
  mother_name: string | null;
  phone: string | null;
};

export type ParentDetail = {
  key: string;
  phone: string;
  displayName: string;
  activated: boolean;
  guardianUserId: string | null;
  accountRole: string | null;
  isStaffGuardian: boolean;
  registryRole: string | null;
  children: ParentChild[];
};

export function buildParentKey(
  phone: string,
  guardianUserId?: string | null,
): string | null {
  if (guardianUserId) return `u-${guardianUserId}`;
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `p-${encodeURIComponent(normalized)}`;
}

export function parentDetailHref(key: string) {
  return `/dashboard/parents/${key}`;
}

export function parseParentKey(key: string): {
  type: "user" | "phone";
  value: string;
} {
  if (key.startsWith("u-")) {
    return { type: "user", value: key.slice(2) };
  }
  if (key.startsWith("p-")) {
    return { type: "phone", value: decodeURIComponent(key.slice(2)) };
  }
  throw new Error("invalid_parent_key");
}

function countByPlayer(
  rows: { player_id: string }[] | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();
  rows?.forEach((row) => {
    map.set(row.player_id, (map.get(row.player_id) ?? 0) + 1);
  });
  return map;
}

function sumCounts(playerIds: string[], map: Map<string, number>) {
  return playerIds.reduce((sum, id) => sum + (map.get(id) ?? 0), 0);
}

export async function fetchParentDirectory(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<ParentDirectoryEntry[]> {
  const [
    { data: registryRows },
    { data: players },
    { data: guardianLinks },
    { data: openDues },
    { data: pendingConvocations },
  ] = await Promise.all([
    supabase
      .from("phone_registry")
      .select(
        "phone_normalized, role, full_name, linked_user_id, player_id",
      )
      .eq("role", "parent")
      .order("full_name", { ascending: true }),
    supabase
      .from("players")
      .select(
        "id, phone, guardian_name, father_name, mother_name, is_archived",
      )
      .eq("is_archived", false)
      .not("phone", "is", null),
    supabase
      .from("player_guardians")
      .select(
        "player_id, guardian_id, profiles ( id, full_name, phone, role )",
      ),
    supabase
      .from("player_dues")
      .select("player_id")
      .in("status", ["pending", "partial", "overdue"]),
    supabase
      .from("convocation_entries")
      .select("player_id, response, convocations ( event_date )")
      .eq("response", "pending"),
  ]);

  const duesByPlayer = countByPlayer(openDues);
  const convByPlayer = countByPlayer(
    pendingConvocations?.filter((entry) => {
      const convocation = unwrapRelation(entry.convocations);
      return (
        convocation &&
        new Date(convocation.event_date).getTime() >= Date.now()
      );
    }),
  );

  const playersByPhone = new Map<string, string[]>();
  players?.forEach((player) => {
    const phone = normalizePhone(player.phone ?? "");
    if (!phone) return;
    const ids = playersByPhone.get(phone) ?? [];
    ids.push(player.id);
    playersByPhone.set(phone, ids);
  });

  const entries = new Map<string, ParentDirectoryEntry>();

  const upsertEntry = (draft: Omit<ParentDirectoryEntry, "key"> & { key?: string }) => {
    const key =
      draft.key ??
      buildParentKey(draft.phone, draft.guardianUserId) ??
      `p-${encodeURIComponent(draft.phone)}`;
    const existing = entries.get(key);
    const childIds = playersByPhone.get(draft.phone) ?? [];

    if (existing) {
      existing.childrenCount = Math.max(
        existing.childrenCount,
        draft.childrenCount,
        childIds.length,
      );
      existing.openDuesCount = Math.max(
        existing.openDuesCount,
        draft.openDuesCount,
        sumCounts(childIds, duesByPlayer),
      );
      existing.pendingConvocationsCount = Math.max(
        existing.pendingConvocationsCount,
        draft.pendingConvocationsCount,
        sumCounts(childIds, convByPlayer),
      );
      existing.activated = existing.activated || draft.activated;
      if (!existing.guardianUserId && draft.guardianUserId) {
        existing.guardianUserId = draft.guardianUserId;
      }
      if (!existing.accountRole && draft.accountRole) {
        existing.accountRole = draft.accountRole;
      }
      return;
    }

    entries.set(key, {
      key,
      phone: draft.phone,
      displayName: draft.displayName,
      activated: draft.activated,
      guardianUserId: draft.guardianUserId,
      accountRole: draft.accountRole,
      isStaffGuardian: draft.isStaffGuardian,
      childrenCount: Math.max(draft.childrenCount, childIds.length),
      openDuesCount: Math.max(
        draft.openDuesCount,
        sumCounts(childIds, duesByPlayer),
      ),
      pendingConvocationsCount: Math.max(
        draft.pendingConvocationsCount,
        sumCounts(childIds, convByPlayer),
      ),
    });
  };

  registryRows?.forEach((row) => {
    const childIds = playersByPhone.get(row.phone_normalized) ?? [];
    upsertEntry({
      phone: row.phone_normalized,
      displayName: row.full_name ?? "Parent",
      activated: Boolean(row.linked_user_id),
      guardianUserId: row.linked_user_id,
      accountRole: row.linked_user_id ? "parent" : null,
      isStaffGuardian: false,
      childrenCount: childIds.length,
      openDuesCount: sumCounts(childIds, duesByPlayer),
      pendingConvocationsCount: sumCounts(childIds, convByPlayer),
    });
  });

  const guardianChildren = new Map<string, string[]>();
  guardianLinks?.forEach((link) => {
    const profile = unwrapRelation(link.profiles);
    if (!profile) return;
    const ids = guardianChildren.get(profile.id) ?? [];
    ids.push(link.player_id);
    guardianChildren.set(profile.id, [...new Set(ids)]);
  });

  guardianLinks?.forEach((link) => {
    const profile = unwrapRelation(link.profiles);
    if (!profile || profile.role === "parent") return;

    const phone =
      normalizePhone(profile.phone ?? "") ??
      players?.find((p) => p.id === link.player_id)?.phone
        ? normalizePhone(
            players!.find((p) => p.id === link.player_id)!.phone ?? "",
          )
        : null;

    const childIds = guardianChildren.get(profile.id) ?? [];
    if (!phone && childIds.length === 0) return;

    const resolvedPhone =
      phone ??
      `staff-${profile.id.slice(0, 8)}`;

    upsertEntry({
      key: `u-${profile.id}`,
      phone: resolvedPhone,
      displayName: profile.full_name ?? "Membre staff",
      activated: true,
      guardianUserId: profile.id,
      accountRole: profile.role,
      isStaffGuardian: true,
      childrenCount: childIds.length,
      openDuesCount: sumCounts(childIds, duesByPlayer),
      pendingConvocationsCount: sumCounts(childIds, convByPlayer),
    });
  });

  return [...entries.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "fr"),
  );
}

async function resolveChildrenForParent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phone: string | null,
  guardianUserId: string | null,
): Promise<ParentChild[]> {
  const childIds = new Set<string>();

  if (guardianUserId) {
    const { data: links } = await supabase
      .from("player_guardians")
      .select("player_id")
      .eq("guardian_id", guardianUserId);
    links?.forEach((link) => childIds.add(link.player_id));
  }

  if (phone && !phone.startsWith("staff-")) {
    const { data: players } = await supabase
      .from("players")
      .select(
        "id, matricule, first_name, last_name, category, team, guardian_name, father_name, mother_name, phone",
      )
      .eq("is_archived", false);

    players?.forEach((player) => {
      if (normalizePhone(player.phone ?? "") === phone) {
        childIds.add(player.id);
      }
    });
  } else if (guardianUserId) {
    const { data: links } = await supabase
      .from("player_guardians")
      .select("player_id")
      .eq("guardian_id", guardianUserId);
    links?.forEach((link) => childIds.add(link.player_id));
  }

  if (!childIds.size) return [];

  const { data: children } = await supabase
    .from("players")
    .select(
      "id, matricule, first_name, last_name, category, team, guardian_name, father_name, mother_name, phone",
    )
    .in("id", [...childIds])
    .eq("is_archived", false)
    .order("last_name", { ascending: true });

  return children ?? [];
}

export async function fetchParentDetail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  key: string,
): Promise<ParentDetail | null> {
  const parsed = parseParentKey(key);
  let phone: string | null = null;
  let guardianUserId: string | null = null;
  let displayName = "Parent";
  let activated = false;
  let accountRole: string | null = null;
  let isStaffGuardian = false;
  let registryRole: string | null = null;

  if (parsed.type === "user") {
    guardianUserId = parsed.value;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, role")
      .eq("id", guardianUserId)
      .maybeSingle();

    if (!profile) return null;

    displayName = profile.full_name ?? "Parent";
    accountRole = profile.role;
    activated = true;
    isStaffGuardian = profile.role !== "parent";
    phone = normalizePhone(profile.phone ?? "");

    if (phone) {
      const { data: registry } = await supabase
        .from("phone_registry")
        .select("phone_normalized, role, full_name, linked_user_id")
        .eq("phone_normalized", phone)
        .maybeSingle();
      if (registry) {
        registryRole = registry.role;
        displayName = registry.full_name ?? displayName;
        activated = Boolean(registry.linked_user_id ?? guardianUserId);
      }
    }
  } else {
    phone = parsed.value;
    const { data: registry } = await supabase
      .from("phone_registry")
      .select("phone_normalized, role, full_name, linked_user_id")
      .eq("phone_normalized", phone)
      .maybeSingle();

    if (registry) {
      displayName = registry.full_name ?? "Parent";
      registryRole = registry.role;
      guardianUserId = registry.linked_user_id;
      activated = Boolean(registry.linked_user_id);
      accountRole = registry.linked_user_id ? "parent" : null;
    }
  }

  const children = await resolveChildrenForParent(
    supabase,
    phone,
    guardianUserId,
  );

  if (!phone && !guardianUserId && !children.length) {
    return null;
  }

  return {
    key,
    phone: phone ?? children[0]?.phone ?? "",
    displayName,
    activated,
    guardianUserId,
    accountRole,
    isStaffGuardian,
    registryRole,
    children,
  };
}
