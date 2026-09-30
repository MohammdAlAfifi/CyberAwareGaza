export function TemporarySessionIcon({ title }: { title: string }) {
  const titleId = "temporary-session-icon-title";

  return (
    <svg
      aria-labelledby={titleId}
      className="temporary-session-icon"
      role="img"
      viewBox="0 0 120 86"
    >
      <title id={titleId}>{title}</title>
      <circle
        className="temporary-session-icon__badge"
        cx="29"
        cy="30"
        r="22"
      />
      <path className="temporary-session-icon__mark" d="M29 17v16m0 9v1" />
      <path
        className="temporary-session-icon__clock"
        d="M60 12a34 34 0 1 1-10 52"
      />
      <path className="temporary-session-icon__hand" d="M82 28v22l15 11" />
    </svg>
  );
}
