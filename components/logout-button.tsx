"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getDictionary, type Locale } from "@/src/i18n";

export function LogoutButton({ locale }: { locale: Locale }) {
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
      className="button button-ghost"
      disabled={pending}
      onClick={logout}
      type="button"
    >
      {pending ? t.signingOut : t.signOut}
    </button>
  );
}
