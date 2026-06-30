type InfoBannerProps = {
  title?: string;
  children: React.ReactNode;
};

export function InfoBanner({ title, children }: InfoBannerProps) {
  return (
    <div className="rounded-xl border border-green-200 border-l-4 border-l-green-700 bg-green-50/80 px-4 py-3 text-sm text-slate-800">
      {title ? (
        <p className="font-medium text-green-900">{title}</p>
      ) : null}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}
