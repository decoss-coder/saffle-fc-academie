export const PLAYER_PHOTOS_BUCKET = "player-photos";

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export function photoExtension(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export function playerPhotoPath(playerId: string, mimeType: string) {
  return `${playerId}/profile.${photoExtension(mimeType)}`;
}

export function playerInitials(firstName: string, lastName: string) {
  const first = lastName.trim().charAt(0) || "?";
  const second = firstName.trim().charAt(0) || "";
  return `${first}${second}`.toUpperCase();
}
