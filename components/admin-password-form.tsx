"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/form-field";
import { getAdminCopy } from "@/src/admin/copy";
import type { Locale } from "@/src/i18n";

export function AdminPasswordForm({ locale }: { locale: Locale }) {
  const t = getAdminCopy(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setSuccess(false);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setMessage(t.passwordMismatch);
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/admin-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          currentPassword: String(form.get("currentPassword") ?? ""),
          newPassword,
          confirmPassword,
        }),
      });
      const result = (await response.json()) as { ok: boolean; code?: string };
      if (!response.ok || !result.ok) {
        setMessage(
          result.code === "invalid_credentials"
            ? t.currentPasswordWrong
            : result.code === "invalid_input"
              ? t.invalidPassword
              : t.requestFailed,
        );
        return;
      }
      formElement.reset();
      setSuccess(true);
      setMessage(t.passwordChanged);
      router.replace(`/${locale}/admin/settings?changed=1`);
      router.refresh();
    } catch {
      setMessage(t.requestFailed);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="auth-form admin-password-form" onSubmit={submit}>
      <FormField
        autoComplete="current-password"
        label={t.currentPassword}
        name="currentPassword"
        required
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
        type="password"
      />
      <FormField
        autoComplete="new-password"
        label={t.newPassword}
        minLength={12}
        maxLength={128}
        name="newPassword"
        note={t.passwordRule}
        required
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
        type="password"
      />
      <FormField
        autoComplete="new-password"
        label={t.confirmPassword}
        minLength={12}
        maxLength={128}
        name="confirmPassword"
        required
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
        type="password"
      />
      <button
        className="button button-primary"
        disabled={pending}
        type="submit"
      >
        {pending ? t.changingPassword : t.changePassword}
      </button>
      <p
        className={`form-status ${message && !success ? "form-error" : "form-success"}`}
        role="status"
      >
        {message}
      </p>
    </form>
  );
}
