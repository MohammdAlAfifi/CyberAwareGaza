"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getDictionary, type Locale } from "@/src/i18n";

export function AnonymousEntry({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).auth;
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function createSession() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        code?: keyof typeof t.errors;
      };
      if (!response.ok || !result.ok) {
        setMessage(t.errors[result.code ?? "server_error"]);
        return;
      }
      router.replace(`/${locale}/home`);
      router.refresh();
    } catch {
      setMessage(t.errors.server_error);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="button button-primary button-large full"
        disabled={pending}
        onClick={createSession}
        type="button"
      >
        {pending ? t.submitting : t.acknowledge}
      </button>
      <p className="form-status form-error" role="status">
        {message}
      </p>
    </>
  );
}
