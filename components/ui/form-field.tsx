"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  );
}

export function FormField({
  error,
  hidePasswordLabel,
  label,
  note,
  showPasswordLabel,
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hidePasswordLabel?: string;
  label: string;
  note?: string;
  showPasswordLabel?: string;
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const generatedId = useId();
  const fieldId = inputProps.id ?? inputProps.name ?? generatedId;
  const canReveal =
    inputProps.type === "password" && showPasswordLabel && hidePasswordLabel;
  const noteId =
    note && inputProps.name ? `${inputProps.name}-note` : undefined;
  const errorId =
    error && inputProps.name ? `${inputProps.name}-error` : undefined;
  const describedBy = [noteId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="form-field">
      <label htmlFor={fieldId}>{label}</label>
      <span className="input-control">
        <input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          id={fieldId}
          {...inputProps}
          type={canReveal && passwordVisible ? "text" : inputProps.type}
        />
        {canReveal && (
          <button
            aria-label={passwordVisible ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={passwordVisible}
            className="password-toggle"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            <EyeIcon hidden={passwordVisible} />
          </button>
        )}
      </span>
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
    </div>
  );
}
