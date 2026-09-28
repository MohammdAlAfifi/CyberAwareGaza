import { Icon } from "@/components/icon";

export function StatePanel({
  action,
  text,
  title,
  type,
}: {
  action?: string;
  text: string;
  title: string;
  type: "loading" | "empty" | "error";
}) {
  if (type === "loading") {
    return (
      <section aria-busy="true" aria-live="polite" className="state-panel">
        <span className="spinner" aria-hidden="true" />
        <div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <div className="skeleton-stack" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`state-panel state-${type}`}
    >
      <span className="state-icon" aria-hidden="true">
        <Icon name={type === "error" ? "alert" : "assessment"} size={24} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
        {action && type === "error" && (
          <button className="button button-secondary" type="button">
            <Icon name="refresh" size={18} />
            {action}
          </button>
        )}
      </div>
    </section>
  );
}
