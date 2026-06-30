import Image from "next/image";
import Link from "next/link";
import { CLUB } from "@/lib/club";

type ClubLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  light?: boolean;
};

const sizes = {
  sm: { img: 40, title: "text-sm", sub: "text-xs" },
  md: { img: 56, title: "text-base", sub: "text-xs" },
  lg: { img: 80, title: "text-xl", sub: "text-sm" },
};

export function ClubLogo({
  size = "md",
  showText = true,
  href = "/",
  light = false,
}: ClubLogoProps) {
  const s = sizes[size];
  const titleClass = light ? "text-white" : "text-green-900";
  const subClass = light ? "text-green-100" : "text-green-700";

  const content = (
    <div className="flex items-center gap-3">
      <Image
        src={CLUB.assets.logo}
        alt={CLUB.name}
        width={s.img}
        height={s.img}
        className="rounded-full object-cover ring-2 ring-green-600/30"
        priority
      />
      {showText && (
        <div>
          <p className={`font-semibold leading-tight ${titleClass} ${s.title}`}>
            {CLUB.name}
          </p>
          <p className={`${subClass} ${s.sub}`}>{CLUB.location}</p>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
