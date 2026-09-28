import { getDictionary, type Locale } from "@/src/i18n";

export function SourceGate({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).gate;
  return (
    <aside className="source-gate" aria-labelledby="source-gate-title">
      <span className="gate-icon" aria-hidden="true">i</span>
      <div>
        <h2 id="source-gate-title">{t.title}</h2>
        <p>{t.text}</p>
      </div>
    </aside>
  );
}
