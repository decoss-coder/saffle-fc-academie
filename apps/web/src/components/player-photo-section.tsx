import { getPlayerPhotoSignedUrl } from "@/app/dashboard/joueurs/photo-actions";
import { PlayerPhotoUpload } from "@/components/player-photo-upload";

type PlayerPhotoSectionProps = {
  playerId: string;
  firstName: string;
  lastName: string;
  photoPath?: string | null;
};

export async function PlayerPhotoSection({
  playerId,
  firstName,
  lastName,
  photoPath,
}: PlayerPhotoSectionProps) {
  const currentPhotoUrl = await getPlayerPhotoSignedUrl(photoPath);

  return (
    <PlayerPhotoUpload
      playerId={playerId}
      playerName={`${lastName} ${firstName}`}
      firstName={firstName}
      lastName={lastName}
      currentPhotoPath={photoPath}
      currentPhotoUrl={currentPhotoUrl}
    />
  );
}
