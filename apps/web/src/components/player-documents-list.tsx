import Link from "next/link";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_STYLES,
  formatDocumentType,
  formatFileSize,
} from "@/lib/documents/constants";
import { getDocumentSignedUrl } from "@/app/dashboard/documents/actions";
import { DocumentReviewActions } from "@/components/document-review-actions";

export type PlayerDocumentRow = {
  id: string;
  player_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  player_name?: string;
  player_matricule?: string;
};

type PlayerDocumentsListProps = {
  documents: PlayerDocumentRow[];
  canReview?: boolean;
  showPlayerLink?: boolean;
  playerLabel?: string;
};

export async function PlayerDocumentsList({
  documents,
  canReview = false,
  showPlayerLink = false,
  playerLabel,
}: PlayerDocumentsListProps) {
  if (!documents.length) {
    return (
      <p className="rounded-2xl border border-dashed border-green-300 bg-white p-6 text-sm text-green-700">
        Aucun document déposé pour le moment.
      </p>
    );
  }

  const items = await Promise.all(
    documents.map(async (doc) => ({
      ...doc,
      signedUrl: await getDocumentSignedUrl(doc.file_path),
    })),
  );

  return (
    <div className="space-y-3">
      {items.map((doc) => (
        <article
          key={doc.id}
          className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-green-900">
                {formatDocumentType(doc.document_type)}
              </p>
              <p className="mt-1 text-sm text-green-700">{doc.file_name}</p>
              <p className="mt-1 text-xs text-green-600">
                {formatFileSize(doc.file_size)} ·{" "}
                {new Intl.DateTimeFormat("fr-CI", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(doc.created_at))}
              </p>
              {doc.player_name && (
                <p className="mt-1 text-sm font-medium text-green-800">
                  {doc.player_name}
                  {doc.player_matricule ? ` · ${doc.player_matricule}` : ""}
                </p>
              )}
              {showPlayerLink && playerLabel && (
                <p className="mt-1 text-xs text-green-600">{playerLabel}</p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${DOCUMENT_STATUS_STYLES[doc.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              {DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
            </span>
          </div>

          {doc.admin_note && (
            <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
              {doc.admin_note}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {doc.signedUrl ? (
              <a
                href={doc.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-green-300 px-4 py-1.5 text-xs font-medium text-green-800 hover:bg-green-50"
              >
                Ouvrir
              </a>
            ) : (
              <span className="text-xs text-red-600">Fichier inaccessible</span>
            )}
            {showPlayerLink && (
              <Link
                href={`/dashboard/joueurs/${doc.player_id}`}
                className="rounded-full border border-green-300 px-4 py-1.5 text-xs font-medium text-green-800 hover:bg-green-50"
              >
                Fiche joueur
              </Link>
            )}
          </div>

          {canReview && (
            <DocumentReviewActions
              documentId={doc.id}
              playerId={doc.player_id}
              currentStatus={doc.status}
            />
          )}
        </article>
      ))}
    </div>
  );
}
