import { getDictionary, type Locale } from "@/src/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <strong>CyberAwareGaza</strong>
        <span>{getDictionary(locale).footer}</span>
      </div>
    </footer>
  );
}
