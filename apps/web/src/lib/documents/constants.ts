export const DOCUMENT_TYPES = [
  { value: "certificat_medical", label: "Certificat médical" },
  { value: "autorisation_parentale", label: "Autorisation parentale" },
  { value: "certificat_naissance", label: "Certificat de naissance" },
  { value: "piece_identite", label: "Pièce d'identité" },
  { value: "photo_identite", label: "Photo d'identité" },
  { value: "autre", label: "Autre document" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  expired: "Expiré",
};

export const DOCUMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
  expired: "bg-gray-100 text-gray-700",
};

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export function formatDocumentType(type: string) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const PLAYER_DOCUMENTS_BUCKET = "player-documents";
