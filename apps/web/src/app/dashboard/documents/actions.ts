"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canManagePlayers, canUploadDocuments } from "@/lib/auth";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  type DocumentType,
} from "@/lib/documents/constants";

export type DocumentActionState = {
  error?: string;
  success?: string;
};

function isValidDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.some((item) => item.value === value);
}

async function assertCanAccessPlayer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: string,
) {
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .maybeSingle();

  return Boolean(player);
}

export async function registerPlayerDocument(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const { user, profile } = await requireUser();
  if (!canUploadDocuments(profile.role)) {
    return { error: "Vous n'avez pas la permission de déposer des documents." };
  }

  const playerId = String(formData.get("player_id") ?? "").trim();
  const documentType = String(formData.get("document_type") ?? "").trim();
  const filePath = String(formData.get("file_path") ?? "").trim();
  const fileName = String(formData.get("file_name") ?? "").trim();
  const mimeType = String(formData.get("mime_type") ?? "").trim();
  const fileSize = Number(formData.get("file_size") ?? 0);

  if (!playerId || !documentType || !filePath || !fileName) {
    return { error: "Informations du document incomplètes." };
  }

  if (!isValidDocumentType(documentType)) {
    return { error: "Type de document invalide." };
  }

  if (!filePath.startsWith(`${playerId}/`)) {
    return { error: "Chemin de fichier invalide." };
  }

  if (
    mimeType &&
    !ALLOWED_DOCUMENT_MIME_TYPES.includes(
      mimeType as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number],
    )
  ) {
    return { error: "Format de fichier non autorisé." };
  }

  if (fileSize > MAX_DOCUMENT_SIZE_BYTES) {
    return { error: "Le fichier dépasse la taille maximale (10 Mo)." };
  }

  const supabase = await createClient();
  const hasAccess = await assertCanAccessPlayer(supabase, playerId);
  if (!hasAccess) {
    return { error: "Joueur introuvable ou accès refusé." };
  }

  const { error } = await supabase.from("player_documents").insert({
    player_id: playerId,
    uploaded_by: user.id,
    document_type: documentType,
    file_name: fileName,
    file_path: filePath,
    file_size: fileSize || null,
    mime_type: mimeType || null,
    status: "pending",
  });

  if (error) {
    return { error: "Impossible d'enregistrer le document." };
  }

  revalidatePath("/dashboard/mes-documents");
  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/joueurs/${playerId}`);
  return { success: "Document déposé. Il sera examiné par le staff." };
}

export async function reviewPlayerDocument(
  _prev: DocumentActionState,
  formData: FormData,
): Promise<DocumentActionState> {
  const { user, profile } = await requireUser();
  if (!canManagePlayers(profile.role)) {
    return { error: "Permission refusée." };
  }

  const documentId = String(formData.get("document_id") ?? "").trim();
  const playerId = String(formData.get("player_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const adminNote = String(formData.get("admin_note") ?? "").trim() || null;

  if (!documentId || !playerId) {
    return { error: "Document introuvable." };
  }

  if (status !== "approved" && status !== "rejected") {
    return { error: "Statut invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("player_documents")
    .update({
      status,
      admin_note: adminNote,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("player_id", playerId);

  if (error) {
    return { error: "Impossible de mettre à jour le document." };
  }

  revalidatePath("/dashboard/mes-documents");
  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/joueurs/${playerId}`);
  return { success: status === "approved" ? "Document approuvé." : "Document rejeté." };
}

export async function getDocumentSignedUrl(filePath: string) {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("player-documents")
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
