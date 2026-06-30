import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import { ClubSection } from "@/components/club-ui";
import {
  PlanningForms,
  PlanningTeamTabs,
  ScheduleTable,
} from "./planning-client";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string }>;
}) {
  const { groupe } = await searchParams;
  const activeTeam =
    PLAYER_GROUPS.find((g) => g.team === groupe)?.team ?? PLAYER_GROUPS[0].team;

  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from("training_schedules")
    .select("*")
    .eq("is_active", true)
    .order("team")
    .order("day_of_week");

  const { data: targets } = await supabase.from("team_training_targets").select("*");
  const targetMap = Object.fromEntries(
    (targets ?? []).map((t) => [t.team, t]),
  );

  const weeklyHours = Object.fromEntries(
    PLAYER_GROUPS.map((g) => {
      const teamSlots = (schedules ?? []).filter((s) => s.team === g.team);
      const hours = teamSlots.reduce(
        (sum, s) =>
          sum +
          (new Date(`1970-01-01T${s.end_time}`).getTime() -
            new Date(`1970-01-01T${s.start_time}`).getTime()) /
            3600000,
        0,
      );
      return [g.team, hours];
    }),
  );

  return (
    <DashboardShell
      title="Planning entraînements"
      subtitle={`${activeTeam} — ${CLUB.name}`}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link href="/dashboard/club" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">
          Retour
        </Link>
      }
    >
      <PlanningTeamTabs activeTeam={activeTeam} />

      <ClubSection title="Objectif vs planifié">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLAYER_GROUPS.map((g) => {
            const target = targetMap[g.team];
            const planned = weeklyHours[g.team] ?? 0;
            const min = Number(target?.min_hours_per_week ?? 0);
            const ok = planned >= min;
            return (
              <div key={g.team} className="rounded-2xl border border-green-200 bg-white p-4">
                <p className="font-medium text-green-900">{g.team}</p>
                <p className="mt-1 text-sm text-green-700">
                  {planned.toFixed(1)} h planifiées / {min} h min.
                </p>
                <p className={`mt-1 text-xs font-medium ${ok ? "text-green-700" : "text-amber-700"}`}>
                  {ok ? "Objectif atteint" : "Sous le minimum"}
                </p>
                {target?.championship_date && (
                  <p className="mt-1 text-xs text-green-600">
                    Championnat : {new Intl.DateTimeFormat("fr-CI").format(new Date(target.championship_date))}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </ClubSection>

      <PlanningForms team={activeTeam} targets={targetMap} />

      <ClubSection title="Tous les créneaux">
        <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
          <ScheduleTable schedules={schedules ?? []} />
        </div>
      </ClubSection>
    </DashboardShell>
  );
}
