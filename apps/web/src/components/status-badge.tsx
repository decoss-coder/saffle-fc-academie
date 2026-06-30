import {
  STATUS_VARIANT_CLASSES,
  type StatusVariant,
} from "@/lib/dashboard-ui";

type StatusBadgeProps = {
  label: string;
  variant: StatusVariant;
  title?: string;
};

export function StatusBadge({ label, variant, title }: StatusBadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_VARIANT_CLASSES[variant]}`}
    >
      {label}
    </span>
  );
}
