import Link from "next/link";
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
        <label>
          {t.username}
          <input
            name="username"
            autoComplete="username"
            minLength={3}
            maxLength={40}
            required
          />
        </label>
        {signup && (
          <label>
            {t.displayName}
            <input name="displayName" autoComplete="name" maxLength={120} />
          </label>
        )}
        <label>
          {t.password}
          <input
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            minLength={12}
            required
          />
        </label>
        {signup && (
          <label>
            {t.confirm}
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
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
        <span>or</span>
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
