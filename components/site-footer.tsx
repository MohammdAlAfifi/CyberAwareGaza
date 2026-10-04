import { getDictionary, type Locale } from "@/src/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <strong>CyberAwareGaza</strong>
        <strong className="footer-credit">developed by Yousef Alafifi</strong>
        <span>{getDictionary(locale).footer}</span>
      </div>
    </footer>
  );
}
