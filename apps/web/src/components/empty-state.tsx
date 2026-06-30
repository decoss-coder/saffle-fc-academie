type EmptyStateProps = {
  message: string;
  children?: React.ReactNode;
};

export function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-green-300 bg-white p-10 text-center">
      <p className="text-green-800">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
