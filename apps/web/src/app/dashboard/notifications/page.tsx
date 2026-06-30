import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/notifications/constants";
import { markAllNotificationsRead } from "@/lib/notifications/actions";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ lue?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  if (params.lue === "toutes") {
    await markAllNotificationsRead();
    redirect("/dashboard/notifications");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at, player_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unreadCount =
    notifications?.filter((item) => !item.read_at).length ?? 0;

  return (
    <DashboardShell
      title="Notifications"
      subtitle={`${unreadCount} non lue(s) — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        unreadCount > 0 ? (
          <Link
            href="/dashboard/notifications?lue=toutes"
            className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800 hover:bg-green-50"
          >
            Tout marquer comme lu
          </Link>
        ) : undefined
      }
    >
      {!notifications?.length ? (
        <p className="rounded-2xl border border-dashed border-green-300 bg-white p-10 text-center text-green-700">
          Aucune notification pour le moment.
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const content = (
              <article
                className={`rounded-2xl border p-5 shadow-sm transition ${
                  notification.read_at
                    ? "border-green-100 bg-white"
                    : "border-green-300 bg-green-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {NOTIFICATION_TYPE_LABELS[notification.type] ??
                      notification.type}
                  </span>
                  <time className="text-xs text-green-600">
                    {new Intl.DateTimeFormat("fr-CI", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(notification.created_at))}
                  </time>
                </div>
                <h2 className="mt-2 font-semibold text-green-900">
                  {notification.title}
                </h2>
                <p className="mt-1 text-sm text-green-700">{notification.body}</p>
              </article>
            );

            if (notification.link) {
              return (
                <Link key={notification.id} href={notification.link}>
                  {content}
                </Link>
              );
            }

            return <div key={notification.id}>{content}</div>;
          })}
        </div>
      )}
    </DashboardShell>
  );
}
