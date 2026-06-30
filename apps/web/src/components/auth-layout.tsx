import { CLUB } from "@/lib/club";
import { PublicHeader } from "@/components/public-header";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  headerAction: {
    href: string;
    label: string;
    variant?: "outline" | "solid";
  };
  children: React.ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  headerAction,
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#071c16] text-white">
      <PublicHeader
        actionHref={headerAction.href}
        actionLabel={headerAction.label}
        actionVariant={headerAction.variant}
      />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-4">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(7,28,22,0.92), rgba(7,28,22,0.92)), url(${CLUB.assets.u16Jeunes})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(211,173,69,0.12),transparent_45%)]" />

        <section className="relative w-full max-w-md rounded-xl border border-[#d3ad45]/35 bg-[#f8faf6] p-6 text-[#06110b] shadow-2xl shadow-black/40 sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#b99331]">
            {subtitle}
          </p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-[#06110b] sm:text-3xl">
            {title}
          </h1>
          <div className="mt-5">{children}</div>
        </section>
      </main>
    </div>
  );
}
