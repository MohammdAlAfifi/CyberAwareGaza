"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";

import type { Locale } from "@/src/i18n";

export function DeleteParticipantButton({
  participantId,
  participantName,
  publicCode,
  locale,
  returnToList = false,
}: {
  participantId: string;
  participantName: string;
  publicCode: string;
  locale: Locale;
  returnToList?: boolean;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const deletionStarted = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ar = locale === "ar";

  function openDialog() {
    setError("");
    dialog.current?.showModal();
    requestAnimationFrame(() => cancel.current?.focus());
  }

  function closeDialog() {
    if (!pending) dialog.current?.close();
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("hidden"));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function remove() {
    if (deletionStarted.current) return;
    deletionStarted.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/participants/${participantId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      dialog.current?.close();
      if (returnToList) router.replace(`/${locale}/admin/participants`);
      else router.refresh();
    } catch {
      setError(
        ar
          ? "تعذر حذف المشارك. حاول مرة أخرى."
          : "The participant could not be deleted. Try again.",
      );
    } finally {
      deletionStarted.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="button button-danger"
        onClick={openDialog}
        ref={trigger}
        type="button"
      >
        {ar ? "حذف" : "Delete"}
      </button>
      <dialog
        aria-describedby="delete-participant-description"
        aria-labelledby="delete-participant-title"
        className="delete-dialog"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        onClick={(event) => {
          if (event.target === dialog.current) closeDialog();
        }}
        onClose={() => trigger.current?.focus()}
        onKeyDown={trapFocus}
        ref={dialog}
      >
        <div className="delete-dialog-copy">
          <header className="delete-dialog-header">
            <p className="eyebrow">{ar ? "تأكيد الحذف" : "Confirm deletion"}</p>
            <h2 id="delete-participant-title">
              {ar ? "حذف المشارك؟" : "Delete participant?"}
            </h2>
          </header>
          <div className="delete-dialog-body">
            <p className="delete-dialog-participant">
              <strong>{participantName}</strong>
              <bdi dir="ltr">{publicCode}</bdi>
            </p>
            <p id="delete-participant-description">
              {ar
                ? "سيؤدي هذا إلى حذف المشارك نهائيًا مع جميع تقييماته وإجاباته ونتائج التقييم وجلساته. سيبقى سجل تدقيق إداري بسيط دون الإجابات."
                : "This permanently deletes the participant and all assessments, answers, scoring traces, and sessions. A minimal admin audit entry without answers will remain."}
            </p>
            {error ? (
              <p className="delete-dialog-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <div className="delete-dialog-actions">
            <button
              className="button button-secondary"
              disabled={pending}
              onClick={closeDialog}
              ref={cancel}
              type="button"
            >
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button
              className="button button-danger"
              disabled={pending}
              onClick={remove}
              type="button"
            >
              {pending
                ? ar
                  ? "جارٍ الحذف…"
                  : "Deleting…"
                : ar
                  ? "حذف المشارك"
                  : "Delete participant"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
