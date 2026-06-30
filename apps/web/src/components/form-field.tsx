"use client";

type RequiredLabelProps = {
  htmlFor?: string;
  children: React.ReactNode;
};

export function RequiredLabel({ htmlFor, children }: RequiredLabelProps) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm text-green-800">
      {children}
      <span className="ml-0.5 text-red-600" aria-hidden>
        *
      </span>
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-700" role="alert">
      {message}
    </p>
  );
}

export function fieldErrorClass(hasError: boolean) {
  return hasError ? "border-red-400 ring-red-200" : "border-green-200";
}

export function validateRequired(value: string): string | undefined {
  return value.trim() ? undefined : "Ce champ est requis.";
}
