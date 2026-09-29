export type AuthErrorCode =
  | "invalid_input"
  | "invalid_credentials"
  | "signup_unavailable"
  | "rate_limited"
  | "forbidden"
  | "session_required"
  | "server_error";

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    public readonly status: number,
  ) {
    super(code);
    this.name = "AuthError";
  }
}
