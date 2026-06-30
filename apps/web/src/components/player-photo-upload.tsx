"use client";

import { useActionState, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerPlayerPhoto } from "@/app/dashboard/joueurs/photo-actions";
import {
  PLAYER_PHOTOS_BUCKET,
  playerPhotoPath,
} from "@/lib/players/photos";
import type { PhotoActionState } from "@/app/dashboard/joueurs/photo-actions";
import { PlayerAvatarClient } from "@/components/player-avatar-client";

const initialState: PhotoActionState = {};

type PlayerPhotoUploadProps = {
  playerId: string;
  playerName: string;
  firstName: string;
  lastName: string;
  currentPhotoPath?: string | null;
  currentPhotoUrl?: string | null;
};

export function PlayerPhotoUpload({
  playerId,
  playerName,
  firstName,
  lastName,
  currentPhotoPath,
  currentPhotoUrl,
}: PlayerPhotoUploadProps) {
  const [state, formAction, pending] = useActionState(
    registerPlayerPhoto,
    initialState,
  );
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentPhotoUrl ?? null,
  );
  const [photoPath, setPhotoPath] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    setLocalError(null);
    setPhotoPath("");

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLocalError("La photo dépasse 5 Mo.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLocalError("Choisissez une image (JPG, PNG…).");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    const supabase = createClient();
    const storagePath = playerPhotoPath(playerId, file.type || "image/jpeg");

    const { error } = await supabase.storage
      .from(PLAYER_PHOTOS_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    setUploading(false);

    if (error) {
      setLocalError("Échec du téléversement. Réessayez.");
      setPreviewUrl(currentPhotoUrl ?? null);
      return;
    }

    setPhotoPath(storagePath);
  }

  const busy = uploading || pending;
  const error = localError ?? state.error;

  return (
    <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PlayerAvatarClient
          photoUrl={previewUrl}
          firstName={firstName}
          lastName={lastName}
          size="lg"
        />

        <div className="flex-1">
          <h3 className="font-medium text-green-900">Photo de profil</h3>
          <p className="mt-1 text-sm text-green-700">{playerName}</p>
          <p className="mt-1 text-xs text-green-600">
            Prenez une photo ou importez une image (max 5 Mo).
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="player_id" value={playerId} />
        <input type="hidden" name="photo_path" value={photoPath} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            className="rounded-full bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            Prendre une photo
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="rounded-full border border-green-300 px-4 py-2 text-sm text-green-800 hover:bg-green-50 disabled:opacity-60"
          >
            Choisir un fichier
          </button>
          <button
            type="submit"
            disabled={busy || !photoPath}
            className="rounded-full border border-green-800 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50 disabled:opacity-60"
          >
            {pending ? "Enregistrement..." : "Enregistrer la photo"}
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        {currentPhotoPath && !photoPath && (
          <p className="text-xs text-green-600">Photo actuelle enregistrée.</p>
        )}

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
      </form>
    </div>
  );
}
