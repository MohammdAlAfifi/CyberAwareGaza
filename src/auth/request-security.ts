import { AuthError } from "@/src/auth/errors";
import { env } from "@/src/lib/env";

export function assertTrustedMutationRequest(request: Request): void {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!origin || !env.APP_ORIGINS.includes(origin)) {
    throw new AuthError("forbidden", 403);
  }

  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    throw new AuthError("forbidden", 403);
  }
}

export function requestClientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0];
  return forwarded?.trim() || request.headers.get("x-real-ip") || "unknown";
}
