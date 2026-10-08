import Link from "next/link";

import { Icon } from "@/components/icon";
import { Panel } from "@/components/ui/panel";
import type { Locale } from "@/src/i18n";

export function AssessmentCompletion({ locale }: { locale: Locale }) {
  return (
    <Panel className="assessment-card assessment-gate-card thank-you-card">
      <span className="section-icon" aria-hidden="true">
        <Icon name="shield" />
      </span>
      <h1>{locale === "ar" ? "شكرًا لك" : "Thank You"}</h1>
      <p>
        {locale === "ar"
          ? "تم حفظ تقييمك واحتساب نتيجتك بنجاح. يمكنك عرض النتيجة التفصيلية من لوحة التحكم."
          : "Your assessment and calculated result were saved successfully. You can open the detailed result from your dashboard."}
      </p>
      <Link
        className="button button-primary button-large"
        href={`/${locale}/home`}
      >
        {locale === "ar" ? "العودة إلى لوحة التحكم" : "Return to Dashboard"}
      </Link>
    </Panel>
  );
}
