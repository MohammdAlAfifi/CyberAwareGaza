import type { InputHTMLAttributes } from "react";

export function FormField({
  error,
  label,
  note,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  label: string;
  note?: string;
}) {
  const noteId =
    note && inputProps.name ? `${inputProps.name}-note` : undefined;
  const errorId =
    error && inputProps.name ? `${inputProps.name}-error` : undefined;
  const describedBy = [noteId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        {...inputProps}
      />
      {note && (
        <small id={noteId} className="field-note">
          {note}
        </small>
      )}
      {error && (
        <small id={errorId} className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}
