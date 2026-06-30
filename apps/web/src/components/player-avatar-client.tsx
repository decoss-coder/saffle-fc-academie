"use client";

import { playerInitials } from "@/lib/players/photos";

type PlayerAvatarClientProps = {
  photoUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-base",
  lg: "h-24 w-24 text-xl",
  xl: "h-32 w-32 text-2xl",
};

export function PlayerAvatarClient({
  photoUrl,
  firstName,
  lastName,
  size = "md",
  className = "",
}: PlayerAvatarClientProps) {
  const sizeClass = sizeClasses[size];
  const initials = playerInitials(firstName, lastName);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${lastName} ${firstName}`}
        className={`rounded-full object-cover ring-2 ring-green-200 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-green-100 font-semibold text-green-800 ring-2 ring-green-200 ${sizeClass} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
