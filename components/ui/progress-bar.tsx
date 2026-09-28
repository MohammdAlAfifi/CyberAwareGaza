export function ProgressBar({
  label,
  text,
  value,
}: {
  label: string;
  text: string;
  value: number;
}) {
  return (
    <div className="progress-group">
      <div className="progress-label">
        <span>{label}</span>
        <bdi dir="ltr">{text}</bdi>
      </div>
      <div
        aria-label={label}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={value}
        className="progress-track"
        role="progressbar"
      >
        <span className="progress-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
