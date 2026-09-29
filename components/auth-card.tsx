"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/form-field";
import { getDictionary, type Locale } from "@/src/i18n";

export function AuthCard({
  locale,
  mode,
}: {
  locale: Locale;
  mode: "admin" | "login" | "signup";
}) {
  const t = getDictionary(locale).auth;
  const signup = mode === "signup";
  const admin = mode === "admin";
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setInvalidFields([]);
    const form = new FormData(event.currentTarget);
    const payload = {
      locale,
      username: String(form.get("username") ?? ""),
      password: String(form.get("password") ?? ""),
      ...(signup
        ? {
            displayName: String(form.get("displayName") ?? ""),
            confirmPassword: String(form.get("confirmPassword") ?? ""),
          }
        : {}),
    };

    try {
      const response = await fetch(
        signup
          ? "/api/auth/signup"
          : admin
            ? "/api/auth/admin-login"
            : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as {
        ok: boolean;
        code?: keyof typeof t.errors;
        fields?: string[];
      };
      if (!response.ok || !result.ok) {
        setInvalidFields(result.fields ?? []);
        setMessage(t.errors[result.code ?? "server_error"]);
        return;
      }
      router.replace(admin ? `/${locale}/admin` : `/${locale}/home`);
      router.refresh();
    } catch {
      setMessage(t.errors.server_error);
    } finally {
      setPending(false);
    }
  }

  const fieldError = (field: string, text: string) =>
    invalidFields.includes(field) ? text : undefined;

  return (
    <section className="auth-card">
      <p className="eyebrow">
        {admin ? t.adminLogin : signup ? t.create : t.participantLogin}
      </p>
      <h1>{admin ? t.adminLogin : signup ? t.create : t.participantLogin}</h1>
      <p className="auth-intro">
        {admin ? t.adminIntro : signup ? t.createIntro : t.loginIntro}
      </p>
      <form
        className="auth-form"
        aria-describedby="auth-status"
        onSubmit={submit}
      >
        <FormField
          autoComplete="username"
          error={fieldError("username", t.validation.username)}
          label={t.username}
          maxLength={40}
          minLength={3}
          name="username"
          required
        />
        {signup && (
          <FormField
            autoComplete="name"
            error={fieldError("displayName", t.validation.displayName)}
            label={t.displayName}
            maxLength={120}
            name="displayName"
          />
        )}
        <FormField
          autoComplete={signup ? "new-password" : "current-password"}
          error={fieldError("password", t.validation.password)}
          label={t.password}
          minLength={12}
          name="password"
          required
          type="password"
        />
        {signup && (
          <FormField
            autoComplete="new-password"
            error={fieldError("confirmPassword", t.validation.confirm)}
            label={t.confirm}
            minLength={12}
            name="confirmPassword"
            required
            type="password"
          />
        )}
        {!admin && <p className="field-note">{t.noEmail}</p>}
        <button
          className="button button-primary button-large"
          aria-describedby="auth-status"
          disabled={pending}
          type="submit"
        >
          {pending
            ? t.submitting
            : admin
              ? t.adminSignIn
              : signup
                ? t.submitCreate
                : t.signIn}
        </button>
        <p
          id="auth-status"
          className={message ? "form-status form-error" : "form-status"}
          role="status"
        >
          {message}
        </p>
      </form>
      {!admin && (
        <>
          <div className="auth-divider">
            <span aria-hidden="true">•••</span>
          </div>
          <Link
            className="button button-ghost button-large full"
            href={`/${locale}/anonymous`}
          >
            {t.anonymous}
          </Link>
        </>
      )}
    </section>
  );
}
