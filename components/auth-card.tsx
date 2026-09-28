import Link from "next/link";
import { FormField } from "@/components/ui/form-field";
import { getDictionary, type Locale } from "@/src/i18n";

export function AuthCard({
  locale,
  mode,
}: {
  locale: Locale;
  mode: "login" | "signup";
}) {
  const t = getDictionary(locale).auth;
  const signup = mode === "signup";

  return (
    <section className="auth-card">
      <p className="eyebrow">{signup ? t.create : t.participantLogin}</p>
      <h1>{signup ? t.create : t.participantLogin}</h1>
      <p className="auth-intro">{signup ? t.createIntro : t.loginIntro}</p>
      <form className="auth-form" aria-describedby="auth-status">
        <FormField
          autoComplete="username"
          label={t.username}
          maxLength={40}
          minLength={3}
          name="username"
          required
        />
        {signup && (
          <FormField
            autoComplete="name"
            label={t.displayName}
            maxLength={120}
            name="displayName"
          />
        )}
        <FormField
          autoComplete={signup ? "new-password" : "current-password"}
          label={t.password}
          minLength={12}
          name="password"
          required
          type="password"
        />
        {signup && (
          <FormField
            autoComplete="new-password"
            label={t.confirm}
            minLength={12}
            name="confirmPassword"
            required
            type="password"
          />
        )}
        <p className="field-note">{t.noEmail}</p>
        <button
          className="button button-primary button-large"
          type="button"
          aria-describedby="auth-status"
        >
          {signup ? t.submitCreate : t.signIn}
        </button>
        <p id="auth-status" className="form-status" role="status">
          {t.unavailable}
        </p>
      </form>
      <div className="auth-divider">
        <span aria-hidden="true">•••</span>
      </div>
      <Link
        className="button button-ghost button-large full"
        href={`/${locale}/anonymous`}
      >
        {t.anonymous}
      </Link>
    </section>
  );
}
