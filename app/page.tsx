import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isLocale } from "@/src/i18n";

export default async function RootPage() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("cyberaware_locale")?.value;
  redirect(`/${savedLocale && isLocale(savedLocale) ? savedLocale : "en"}`);
}
