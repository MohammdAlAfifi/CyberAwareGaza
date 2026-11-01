"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

import { Icon } from "@/components/icon";
import { getDictionary, type Locale } from "@/src/i18n";
import {
  FEEDBACK_COMMENT_LIMIT,
  ratingFields,
} from "@/src/feedback/validation";
import styles from "./assessment-feedback.module.css";

export function AssessmentFeedback({
  locale,
  attemptId,
  submitted = false,
}: {
  locale: Locale;
  attemptId: string;
  submitted?: boolean;
}) {
  const t = getDictionary(locale).feedback;
  const [saved, setSaved] = useState(submitted);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const dashboard = `/${locale}/home`;
  const arrow = locale === "ar" ? "←" : "→";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    const ratings = Object.fromEntries(
      ratingFields.map((field) => [field, Number(data.get(field))]),
    );
    if (
      ratingFields.some((field) => !data.has(field)) ||
      !data.has("technicalProblem") ||
      !data.has("consent")
    ) {
      setError(t.invalid);
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/assessment/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          ...ratings,
          technicalProblem: data.get("technicalProblem") === "yes",
          comments: data.get("comments"),
          consent: data.get("consent") === "on",
          language: locale,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setError(
          response.status === 400
            ? t.invalid
            : [401, 403, 404].includes(response.status)
              ? t.sessionError
              : t.saveError,
        );
        return;
      }
      setSaved(true);
    } catch {
      setError(t.saveError);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section
      className={styles.card}
      dir={locale === "ar" ? "rtl" : "ltr"}
      aria-labelledby="feedback-title"
    >
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.icon} aria-hidden="true">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </span>
          <div className={styles.title}>
            <h2 id="feedback-title">{t.title}</h2>
            <span className={styles.badge}>{t.optional}</span>
          </div>
        </div>
        {!saved && (
          <Link className={styles.skip} href={dashboard}>
            {t.skip} <span aria-hidden="true">{arrow}</span>
          </Link>
        )}
      </div>
      {saved ? (
        <div className={styles.success} role="status">
          <span className={styles.successIcon}>
            <Icon name="check" size={24} />
          </span>
          <h3>{t.successTitle}</h3>
          <p>{t.successDescription}</p>
          <Link href={dashboard}>
            {t.dashboard} <span aria-hidden="true">{arrow}</span>
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.description}>{t.description}</p>
          <form
            className={styles.form}
            onSubmit={submit}
            aria-busy={pending}
            noValidate
          >
            <div className={styles.scale} id="feedback-scale">
              <span>{t.disagree}</span>
              <span>{t.agree}</span>
            </div>
            {ratingFields.map((field, index) => (
              <fieldset
                className={styles.question}
                key={field}
                aria-describedby="feedback-scale"
                disabled={pending}
              >
                <legend>{t.questions[index]}</legend>
                <div className={styles.ratings}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div className={styles.option} key={value}>
                      <input
                        className={styles.radio}
                        id={`feedback-${field}-${value}`}
                        name={field}
                        type="radio"
                        value={value}
                        required
                      />
                      <label htmlFor={`feedback-${field}-${value}`}>
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
            <fieldset
              className={`${styles.question} ${styles.technical}`}
              disabled={pending}
            >
              <legend>{t.technicalProblem}</legend>
              <div className={styles.binary}>
                {(
                  [
                    ["no", t.no],
                    ["yes", t.yes],
                  ] as const
                ).map(([value, label]) => (
                  <div className={styles.option} key={value}>
                    <input
                      className={styles.radio}
                      id={`feedback-tech-${value}`}
                      type="radio"
                      name="technicalProblem"
                      value={value}
                      required
                    />
                    <label htmlFor={`feedback-tech-${value}`}>{label}</label>
                  </div>
                ))}
              </div>
            </fieldset>
            <div className={styles.comments}>
              <label htmlFor="feedback-comments">
                {t.comments} <span>({t.optional})</span>
              </label>
              <textarea
                id="feedback-comments"
                name="comments"
                rows={3}
                maxLength={FEEDBACK_COMMENT_LIMIT}
                placeholder={t.placeholder}
                disabled={pending}
              />
            </div>
            <div className={styles.notice}>
              <p>{t.notice}</p>
              <label>
                <input
                  type="checkbox"
                  name="consent"
                  required
                  disabled={pending}
                />
                <span>{t.consent}</span>
              </label>
            </div>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <button type="submit" disabled={pending}>
                {pending ? t.submitting : t.submit}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
