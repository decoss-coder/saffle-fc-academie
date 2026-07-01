import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLAYER_GROUPS } from "@/lib/players/constants";
import { ClubSection } from "@/components/club-ui";
import { ClubModuleTabs, resolveClubTab } from "@/components/club-module-tabs";
import { GroupTabs } from "@/components/group-tabs";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import { DataTable, ListCount } from "@/components/data-table";
import { PlanningForms, ScheduleTable } from "./planning-client";

const TABS = ["vue", "planifier"] as const;

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "vue");
  const activeTeam =
    PLAYER_GROUPS.find((g) => g.team === params.groupe)?.team ??
    PLAYER_GROUPS[0].team;

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

  const planifierHref = `/dashboard/club/planning?tab=planifier&groupe=${encodeURIComponent(activeTeam)}`;

  return (
    <DashboardShell
      title="Planning entraînements"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club", href: "/dashboard/club" },
        { label: "Planning" },
        ...(activeTab === "planifier" && activeTeam ? [{ label: activeTeam }] : []),
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        activeTab === "vue" ? (
          <Link href={planifierHref} className={primaryActionClass}>
            Planifier un créneau
          </Link>
        ) : (
          <Link href="/dashboard/club" className={navActionClass}>
            Retour
          </Link>
        )
      }
    >
      <Suspense fallback={<div className="h-10" />}>
        <ClubModuleTabs
          ariaLabel="Planning"
          defaultTab="vue"
          activeTab={activeTab}
          preserveParams={["groupe"]}
          tabs={[
            { id: "vue", label: "Vue d'ensemble", count: schedules?.length ?? 0 },
            { id: "planifier", label: "Planifier" },
          ]}
        />
      </Suspense>

      {activeTab === "vue" ? (
        <>
          <ClubSection title="Objectif vs planifié">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PLAYER_GROUPS.map((g) => {
                const target = targetMap[g.team];
                const planned = weeklyHours[g.team] ?? 0;
                const min = Number(target?.min_hours_per_week ?? 0);
                const ok = planned >= min;
                return (
                  <div
                    key={g.team}
                    className="rounded-2xl border border-green-200 bg-white p-4"
                  >
                    <p className="font-medium text-green-900">{g.team}</p>
                    <p className="mt-1 text-sm text-green-700">
                      {planned.toFixed(1)} h planifiées / {min} h min.
                    </p>
                    <p
                      className={`mt-1 text-xs font-medium ${ok ? "text-green-700" : "text-amber-700"}`}
                    >
                      {ok ? "Objectif atteint" : "Sous le minimum"}
                    </p>
                    {target?.championship_date ? (
                      <p className="mt-1 text-xs text-green-600">
                        Championnat :{" "}
                        {new Intl.DateTimeFormat("fr-CI").format(
                          new Date(target.championship_date),
                        )}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </ClubSection>

          <ClubSection title="Tous les créneaux">
            <DataTable
              count={
                <ListCount
                  count={schedules?.length ?? 0}
                  label="créneau"
                  labelPlural="créneaux"
                />
              }
            >
              <ScheduleTable schedules={schedules ?? []} />
            </DataTable>
          </ClubSection>
        </>
      ) : null}

      {activeTab === "planifier" ? (
        <div className="space-y-6">
          <GroupTabs
            variant="pill"
            activeKey={activeTeam}
            items={PLAYER_GROUPS.map((g) => {
              const count = (schedules ?? []).filter((s) => s.team === g.team).length;
              return {
                key: g.team,
                label: g.team,
                count,
                href: `/dashboard/club/planning?tab=planifier&groupe=${encodeURIComponent(g.team)}`,
              };
            })}
          />
          <PlanningForms team={activeTeam} targets={targetMap} />
        </div>
      ) : null}
    </DashboardShell>
  );
}
