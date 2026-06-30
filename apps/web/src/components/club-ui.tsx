const inputClass =
  "w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950 outline-none ring-green-600 focus:ring-2";

export function ClubSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-green-700">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-green-700">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function ClubCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

export function ClubFormMessages({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  return (
    <>
      {error && (
        <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </p>
      )}
    </>
  );
}

export { inputClass };
