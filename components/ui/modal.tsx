"use client";

import { useRef } from "react";

import { Icon } from "@/components/icon";

export function Modal({
  closeLabel,
  eyebrow,
  text,
  title,
  triggerLabel,
}: {
  closeLabel: string;
  eyebrow: string;
  text: string;
  title: string;
  triggerLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        className="button button-secondary button-large full"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        <Icon name="shield" size={19} />
        {triggerLabel}
      </button>
      <dialog
        aria-labelledby="safety-modal-title"
        className="modal"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
        ref={dialogRef}
      >
        <div className="modal-card">
          <button
            aria-label={closeLabel}
            className="icon-button modal-close"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <Icon name="close" />
          </button>
          <span className="modal-symbol" aria-hidden="true">
            <Icon name="shield" size={28} />
          </span>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="safety-modal-title">{title}</h2>
          <p>{text}</p>
          <button
            className="button button-primary button-large full"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            {closeLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
