"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getDictionary, type Locale } from "@/src/i18n";

export function LogoutButton({
  className = "button button-ghost",
  label,
  locale,
}: {
  className?: string;
  label?: string;
  locale: Locale;
}) {
  const t = getDictionary(locale).auth;
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace(`/${locale}`);
      router.refresh();
    }
  }

  return (
    <button
      className={className}
      disabled={pending}
      onClick={logout}
      type="button"
    >
      {pending ? t.signingOut : (label ?? t.signOut)}
    </button>
  );
}
