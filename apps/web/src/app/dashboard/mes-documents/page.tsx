import {
  DashboardShell,
  requireDocumentUploader,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCategory } from "@/lib/players/constants";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { PlayerDocumentsList } from "@/components/player-documents-list";
import { PlayerPhotoSection } from "@/components/player-photo-section";
import { EmptyState } from "@/components/empty-state";

export default async function MesDocumentsPage() {
  const { user, profile } = await requireDocumentUploader();
  const supabase = await createClient();
  const playerIds = await getLinkedPlayerIds(supabase, user.id);

  const { data: players } = playerIds.length
    ? await supabase
        .from("players")
        .select("id, matricule, first_name, last_name, category, team, photo_url")
        .in("id", playerIds)
        .eq("is_archived", false)
        .order("last_name", { ascending: true })
    : { data: [] };

  const { data: documents } = playerIds.length
    ? await supabase
        .from("player_documents")
        .select(
          "id, player_id, document_type, file_name, file_path, file_size, status, admin_note, created_at, reviewed_at",
        )
        .in("player_id", playerIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <DashboardShell
      title="Mes documents"
      breadcrumbs={[
        { label: "Famille", href: "/dashboard" },
        { label: "Documents" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      {!players?.length ? (
        <EmptyState message="Aucun joueur lié à votre compte pour déposer des documents.">
          <p className="text-sm text-green-700">
            Contactez le club si votre enfant est inscrit avec votre numéro de
            téléphone.
          </p>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {players.map((player) => {
            const playerDocs =
              documents?.filter((doc) => doc.player_id === player.id) ?? [];
            const rejectedTypes = [
              ...new Set(
                playerDocs
                  .filter((doc) => doc.status === "rejected")
                  .map((doc) => doc.document_type),
              ),
            ];
            const playerName = `${player.last_name} ${player.first_name}`;

            return (
              <section key={player.id} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-green-900">
                    {playerName}
                  </h2>
                  <p className="text-sm text-green-700">
                    {player.matricule} · {formatCategory(player.category)}
                    {player.team ? ` · ${player.team}` : ""}
                  </p>
                </div>

                <PlayerPhotoSection
                  playerId={player.id}
                  firstName={player.first_name}
                  lastName={player.last_name}
                  photoPath={player.photo_url}
                />

                <DocumentUploadForm
                  playerId={player.id}
                  playerName={playerName}
                  rejectedTypes={rejectedTypes}
                />

                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">
                    Documents déposés
                  </h3>
                  <PlayerDocumentsList documents={playerDocs} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
