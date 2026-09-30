"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icon";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  assessmentScenarios,
  type ScenarioKey,
} from "@/src/assessment/content";
import { assessmentScenarioPath } from "@/src/assessment/navigation";
import { getDictionary, type Locale } from "@/src/i18n";

type ErrorCode = keyof ReturnType<typeof getDictionary>["assessment"]["errors"];
type Stage = "consent" | "declined" | "instructions" | "scenario" | "submitted";

export function AssessmentFlow({
  locale,
  initialAttemptId,
  initialAnswers,
  initialScenario,
}: {
  locale: Locale;
  initialAttemptId: string | null;
  initialAnswers: Partial<Record<ScenarioKey, string>>;
  initialScenario: number | null;
}) {
  const t = getDictionary(locale).assessment;
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(
    initialAttemptId
      ? initialScenario
        ? "scenario"
        : "instructions"
      : "consent",
  );
  const [attemptId, setAttemptId] = useState(initialAttemptId);
  const [scenarioIndex, setScenarioIndex] = useState(
    initialScenario ? initialScenario - 1 : 0,
  );
  const [answers, setAnswers] = useState(initialAnswers);
  const [savedAnswers, setSavedAnswers] = useState(initialAnswers);
  const [consentDecision, setConsentDecision] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submitConsent() {
    if (consentDecision === null || pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/assessment/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: consentDecision,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        accepted?: boolean;
        attemptId?: string | null;
        code?: ErrorCode;
      };
      if (!response.ok || !result.ok) {
        setMessage(t.errors[result.code ?? "server_error"]);
        return;
      }
      if (!result.accepted) {
        setStage("declined");
        return;
      }
      if (!result.attemptId) {
        setMessage(t.errors.server_error);
        return;
      }
      setAttemptId(result.attemptId);
      setStage("instructions");
    } catch {
      setMessage(t.errors.server_error);
    } finally {
      setPending(false);
    }
  }

  function beginAssessment() {
    setScenarioIndex(0);
    setStage("scenario");
    router.replace(assessmentScenarioPath(locale, 1), { scroll: false });
  }

  async function chooseAnswer(scenarioKey: ScenarioKey, optionId: string) {
    if (!attemptId || pending) return;
    setAnswers((current) => ({ ...current, [scenarioKey]: optionId }));
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/assessment/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, scenarioKey, optionId }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        code?: ErrorCode;
      };
      if (!response.ok || !result.ok) {
        setMessage(t.errors[result.code ?? "server_error"]);
        return;
      }
      setSavedAnswers((current) => ({ ...current, [scenarioKey]: optionId }));
    } catch {
      setMessage(t.errors.server_error);
    } finally {
      setPending(false);
    }
  }

  function moveTo(nextIndex: number) {
    if (nextIndex < 0) {
      setStage("instructions");
      router.replace(`/${locale}/assessment`, { scroll: false });
      return;
    }
    const bounded = Math.min(7, nextIndex);
    setScenarioIndex(bounded);
    setMessage("");
    router.replace(assessmentScenarioPath(locale, bounded + 1), {
      scroll: false,
    });
  }

  async function submitAssessment() {
    if (!attemptId || pending) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        completed?: boolean;
        code?: ErrorCode;
      };
      if (!response.ok || !result.ok || !result.completed) {
        setMessage(t.errors[result.code ?? "server_error"]);
        return;
      }
      setStage("submitted");
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      router.replace(`/${locale}/home`, { scroll: false });
      router.refresh();
    } catch {
      setMessage(t.errors.server_error);
    } finally {
      setPending(false);
    }
  }

  if (stage === "declined") {
    return (
      <Panel className="assessment-card assessment-gate-card">
        <span className="section-icon" aria-hidden="true">
          <Icon name="shield" />
        </span>
        <h1>{t.declinedTitle}</h1>
        <p>{t.declinedText}</p>
        <Link
          className="button button-primary button-large"
          href={`/${locale}/home`}
        >
          {t.returnHome}
        </Link>
      </Panel>
    );
  }

  if (stage === "submitted") {
    return (
      <Panel className="assessment-card assessment-gate-card">
        <span className="spinner" aria-hidden="true" />
        <h1>{t.submittedTitle}</h1>
        <p>{t.submittedText}</p>
      </Panel>
    );
  }

  if (stage === "consent") {
    return (
      <Panel className="assessment-card assessment-gate-card">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.consentTitle}</h1>
        <p className="consent-question">{t.consentQuestion}</p>
        <fieldset className="option-list consent-options">
          <legend className="sr-only">{t.consentLegend}</legend>
          {[
            [true, t.agree],
            [false, t.decline],
          ].map(([decision, label]) => (
            <label className="option-card" key={String(decision)}>
              <input
                checked={consentDecision === decision}
                name="consent"
                onChange={() => setConsentDecision(decision as boolean)}
                type="radio"
              />
              <span className="radio-mark" aria-hidden="true" />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <button
          className="button button-primary button-large full"
          disabled={consentDecision === null || pending}
          onClick={submitConsent}
          type="button"
        >
          {pending ? t.saving : t.continue}
        </button>
        <p className="form-status form-error" role="status">
          {message}
        </p>
      </Panel>
    );
  }

  if (stage === "instructions") {
    return (
      <Panel className="assessment-card assessment-gate-card">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.instructionsTitle}</h1>
        <ul className="instruction-list">
          <li>{t.instructionsIntro}</li>
          <li>{t.instructionsSafety}</li>
          <li>{t.instructionsPrivacy}</li>
        </ul>
        <button
          className="button button-primary button-large full"
          onClick={beginAssessment}
          type="button"
        >
          {t.begin}
        </button>
      </Panel>
    );
  }

  const scenario = assessmentScenarios[scenarioIndex];
  const selected = answers[scenario.key];
  const saved = savedAnswers[scenario.key] === selected;
  const lastScenario = scenarioIndex === assessmentScenarios.length - 1;

  return (
    <Panel className="assessment-card" data-assessment-active="true">
      <ProgressBar
        label={t.progressLabel}
        text={t.progressText.replace("{current}", String(scenario.order))}
        value={(scenario.order / assessmentScenarios.length) * 100}
      />
      <div className="question-block">
        <p className="question-label">{t.questionLabel}</p>
        <h1 className="scenario-question">{scenario.question[locale]}</h1>
      </div>
      <fieldset className="option-list" disabled={pending}>
        <legend className="sr-only">{t.questionLabel}</legend>
        {scenario.options.map((option) => (
          <label className="option-card" key={option.id}>
            <input
              checked={selected === option.id}
              name={scenario.key}
              onChange={() => chooseAnswer(scenario.key, option.id)}
              type="radio"
              value={option.id}
            />
            <span className="radio-mark" aria-hidden="true" />
            {scenario.key === "S4" ? (
              <bdi dir="ltr">{option[locale]}</bdi>
            ) : (
              <span>{option[locale]}</span>
            )}
          </label>
        ))}
      </fieldset>
      <p
        className={message ? "form-status form-error" : "form-status"}
        role="status"
      >
        {message || (pending ? t.saving : selected && saved ? t.saved : "")}
      </p>
      <div className="assessment-actions">
        <button
          className="button button-secondary button-large"
          disabled={pending}
          onClick={() => moveTo(scenarioIndex - 1)}
          type="button"
        >
          <span className="mirrored-icon">
            <Icon name="arrow" size={18} />
          </span>
          {t.previous}
        </button>
        <button
          className="button button-primary button-large"
          disabled={!selected || !saved || pending}
          onClick={
            lastScenario ? submitAssessment : () => moveTo(scenarioIndex + 1)
          }
          type="button"
        >
          {pending
            ? lastScenario
              ? t.submitting
              : t.saving
            : lastScenario
              ? t.submit
              : t.next}
          {!lastScenario && <Icon name="arrow" size={18} />}
        </button>
      </div>
    </Panel>
  );
}
