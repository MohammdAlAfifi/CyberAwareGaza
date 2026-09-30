"use client";

import Link from "next/link";
import { useRef } from "react";

import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";
import { getDictionary, type Locale } from "@/src/i18n";

export function HeaderLogoLink({ locale }: { locale: Locale }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const t = getDictionary(locale);

  function handleLogoClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const assessmentActive = document.querySelector(
      '[data-assessment-active="true"]',
    );
    if (!assessmentActive) return;

    event.preventDefault();
    dialogRef.current?.showModal();
    requestAnimationFrame(() => stayButtonRef.current?.focus());
  }

  return (
    <>
      <Link
        className="logo-link"
        href={`/${locale}`}
        aria-label={t.common.home}
        onClick={handleLogoClick}
      >
        <Logo priority />
      </Link>
      <dialog
        aria-describedby="leave-assessment-description"
        aria-labelledby="leave-assessment-title"
        className="modal leave-assessment-dialog"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
        ref={dialogRef}
      >
        <div className="modal-card">
          <span className="modal-symbol" aria-hidden="true">
            <Icon name="alert" size={28} />
          </span>
          <p className="eyebrow">{t.assessment.leaveEyebrow}</p>
          <h2 id="leave-assessment-title">{t.assessment.leaveTitle}</h2>
          <p id="leave-assessment-description">{t.assessment.leaveText}</p>
          <div className="modal-actions">
            <button
              className="button button-primary button-large"
              onClick={() => dialogRef.current?.close()}
              ref={stayButtonRef}
              type="button"
            >
              {t.assessment.stay}
            </button>
            <Link
              className="button button-secondary button-large"
              href={`/${locale}`}
              onClick={() => dialogRef.current?.close()}
            >
              {t.assessment.leave}
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
