import type { InputHTMLAttributes } from "react";

export function FormField({
  label,
  note,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  note?: string;
}) {
  const noteId =
    note && inputProps.name ? `${inputProps.name}-note` : undefined;

  return (
    <label className="form-field">
      <span>{label}</span>
      <input aria-describedby={noteId} {...inputProps} />
      {note && (
        <small id={noteId} className="field-note">
          {note}
        </small>
      )}
    </label>
  );
}
