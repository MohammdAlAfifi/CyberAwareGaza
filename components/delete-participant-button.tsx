"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ar = locale === "ar";

  async function remove() {
    if (pending) return;
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
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="button button-danger"
        onClick={() => dialog.current?.showModal()}
        type="button"
      >
        {ar ? "حذف" : "Delete"}
      </button>
      <dialog className="delete-dialog" ref={dialog}>
        <div className="delete-dialog-copy">
          <p className="eyebrow">{ar ? "تأكيد الحذف" : "Confirm deletion"}</p>
          <h2>{ar ? "حذف المشارك؟" : "Delete participant?"}</h2>
          <p>
            {ar ? "سيتم حذف" : "This will delete"}{" "}
            <strong>{participantName}</strong> (
            <bdi dir="ltr">{publicCode}</bdi>)
            {ar
              ? " وجميع تقييماته وإجاباته وجلساته نهائيًا. سيبقى سجل تدقيق إداري بسيط دون الإجابات."
              : " and all of their assessments, answers, scoring traces, and sessions. A minimal admin audit entry without answers will remain."}
          </p>
          {error ? (
            <p className="form-status form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="delete-dialog-actions">
            <button
              className="button button-ghost"
              disabled={pending}
              onClick={() => dialog.current?.close()}
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
