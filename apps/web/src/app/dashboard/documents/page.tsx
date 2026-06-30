import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PlayerDocumentsList } from "@/components/player-documents-list";
import { unwrapRelation } from "@/lib/supabase/relation";

export default async function StaffDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const params = await searchParams;
  const filter = params.statut === "pending" ? "pending" : null;

  const { user, profile } = await requireStaff();
  const supabase = await createClient();

  let query = supabase
    .from("player_documents")
    .select(
      `
      id, player_id, document_type, file_name, file_path, file_size, status, admin_note, created_at, reviewed_at,
      players ( first_name, last_name, matricule, team )
    `,
    )
    .order("created_at", { ascending: false });

  if (filter) {
    query = query.eq("status", filter);
  }

  const { data: rawDocuments } = await query;

  const { count: pendingCount } = await supabase
    .from("player_documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const documents = (rawDocuments ?? []).map((doc) => {
    const player = unwrapRelation(doc.players);
    return {
      id: doc.id,
      player_id: doc.player_id,
      document_type: doc.document_type,
      file_name: doc.file_name,
      file_path: doc.file_path,
      file_size: doc.file_size,
      status: doc.status,
      admin_note: doc.admin_note,
      created_at: doc.created_at,
      reviewed_at: doc.reviewed_at,
      player_name: player
        ? `${player.last_name} ${player.first_name}`
        : undefined,
      player_matricule: player?.matricule,
    };
  });

  return (
    <DashboardShell
      title="Documents joueurs"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Documents" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/documents"
          className={`rounded-full px-4 py-2 text-sm ${
            !filter
              ? "bg-green-800 text-white"
              : "border border-green-300 text-green-800 hover:bg-green-50"
          }`}
        >
          Tous
        </Link>
        <Link
          href="/dashboard/documents?statut=pending"
          className={`rounded-full px-4 py-2 text-sm ${
            filter === "pending"
              ? "bg-green-800 text-white"
              : "border border-green-300 text-green-800 hover:bg-green-50"
          }`}
        >
          En attente ({pendingCount ?? 0})
        </Link>
      </div>

      <div className="mt-4">
        <PlayerDocumentsList documents={documents} canReview showPlayerLink />
      </div>
    </DashboardShell>
  );
}
