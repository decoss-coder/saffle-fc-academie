"use client";

import { useActionState, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerPlayerDocument } from "@/app/dashboard/documents/actions";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  PLAYER_DOCUMENTS_BUCKET,
} from "@/lib/documents/constants";
import type { DocumentActionState } from "@/app/dashboard/documents/actions";

const initialState: DocumentActionState = {};
const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

type DocumentUploadFormProps = {
  playerId: string;
  playerName: string;
  allowRejectedResubmit?: boolean;
  rejectedTypes?: string[];
};

export function DocumentUploadForm({
  playerId,
  playerName,
  allowRejectedResubmit = true,
  rejectedTypes = [],
}: DocumentUploadFormProps) {
  const [state, formAction, pending] = useActionState(
    registerPlayerDocument,
    initialState,
  );
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [filePath, setFilePath] = useState("");
  const [fileMeta, setFileMeta] = useState({
    file_name: "",
    mime_type: "",
    file_size: 0,
  });

  async function handleFileChange() {
    setLocalError(null);
    setFilePath("");
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setLocalError("Le fichier dépasse 10 Mo.");
      return;
    }

    if (
      file.type &&
      !ALLOWED_DOCUMENT_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number],
      )
    ) {
      setLocalError("Format non autorisé. Utilisez PDF ou image (JPG, PNG).");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : "";
    const storagePath = `${playerId}/${crypto.randomUUID()}${ext}`;

    const { error } = await supabase.storage
      .from(PLAYER_DOCUMENTS_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    setUploading(false);

    if (error) {
      setLocalError("Échec du téléversement. Réessayez.");
      return;
    }

    setFilePath(storagePath);
    setFileMeta({
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    });
  }

  const busy = uploading || pending;
  const error = localError ?? state.error;

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-medium text-green-900">Déposer un document</h3>
        <p className="mt-1 text-sm text-green-700">{playerName}</p>
      </div>

      <input type="hidden" name="player_id" value={playerId} />
      <input type="hidden" name="file_path" value={filePath} />
      <input type="hidden" name="file_name" value={fileMeta.file_name} />
      <input type="hidden" name="mime_type" value={fileMeta.mime_type} />
      <input type="hidden" name="file_size" value={fileMeta.file_size || ""} />

      <div>
        <label className="mb-1 block text-sm text-green-800">Type de document</label>
        <select name="document_type" required className={inputClass} defaultValue="">
          <option value="">Choisir</option>
          {DOCUMENT_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
              {allowRejectedResubmit &&
              rejectedTypes.includes(item.value)
                ? " (remplacer le rejeté)"
                : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-green-800">Fichier (PDF ou image, max 10 Mo)</label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
          required
          onChange={handleFileChange}
          className="block w-full text-sm text-green-800 file:mr-4 file:rounded-full file:border-0 file:bg-green-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-800 hover:file:bg-green-200"
        />
        {filePath && (
          <p className="mt-2 text-sm text-green-700">
            Fichier prêt : {fileMeta.file_name}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {state.success && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !filePath}
        className="rounded-full bg-green-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {uploading ? "Téléversement..." : pending ? "Enregistrement..." : "Envoyer le document"}
      </button>
    </form>
  );
}
