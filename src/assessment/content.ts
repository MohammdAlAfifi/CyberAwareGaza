export const ASSESSMENT_CONTENT_VERSION = "pdf-section-7-v1";
export const CONSENT_VERSION = "pdf-section-6.3-v1";

export type ScenarioKey = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";

export type AssessmentOption = {
  id: string;
  en: string;
  ar: string;
};

export type AssessmentScenario = {
  key: ScenarioKey;
  order: number;
  question: { en: string; ar: string };
  options: readonly AssessmentOption[];
};

/**
 * Exact bilingual content transcribed from rendered pages 5-8 of
 * CyberAwareGaza_Stitch_Design_Specification.pdf, section 7.
 */
export const assessmentScenarios = [
  {
    key: "S1",
    order: 1,
    question: {
      en: `You received an email that looks like it came from the university Moodle system. It says:
“Your account will be suspended within 2 hours unless you verify your login now.”
The email includes a “Verify Account” button.

What would you do?`,
      ar: `استلمت رسالة بريد إلكتروني تبدو وكأنها صادرة من نظام مودل الخاص بالجامعة، وتقول:
«سيتم إيقاف حسابك خلال ساعتين ما لم تقم بتأكيد تسجيل الدخول الآن.»
وتحتوي الرسالة على زر “تأكيد الحساب”.

ماذا ستفعل؟`,
    },
    options: [
      {
        id: "S1O1",
        en: "Click the button and login immediately.",
        ar: "الضغط على الزر وتسجيل الدخول فورًا.",
      },
      {
        id: "S1O2",
        en: "Open the official Moodle website manually and check notifications.",
        ar: "فتح موقع مودل الرسمي يدويًا والتحقق من الإشعارات.",
      },
      {
        id: "S1O3",
        en: "Ignore without reporting.",
        ar: "تجاهل الرسالة دون الإبلاغ عنها.",
      },
    ],
  },
  {
    key: "S2",
    order: 2,
    question: {
      en: `A WhatsApp message in a class group says:
“New lecture notes uploaded. Download quickly before it gets deleted!”
It includes a shortened link.

What would you do?`,
      ar: `تصل رسالة في مجموعة الصف على واتساب تقول:
«تم رفع ملاحظات جديدة للمحاضرة. حمّلها بسرعة قبل أن يتم حذفها!»
وتحتوي الرسالة على رابط مختصر.

ماذا ستفعل؟`,
    },
    options: [
      {
        id: "S2O1",
        en: "Open the shortened link immediately.",
        ar: "فتح الرابط المختصر فورًا.",
      },
      {
        id: "S2O2",
        en: "Access resources from the official LMS directly.",
        ar: "الدخول إلى المصادر مباشرة من نظام إدارة التعلم الرسمي.",
      },
      {
        id: "S2O3",
        en: "Ask sender for official LMS link.",
        ar: "طلب الرابط الرسمي لنظام إدارة التعلم من المرسل.",
      },
    ],
  },
  {
    key: "S3",
    order: 3,
    question: {
      en: `You received an email that appears to be from your instructor asking you to confirm your student ID and reset your password using an attached file.

What would you do?`,
      ar: `استلمت رسالة بريد إلكتروني تبدو وكأنها من مدرسك، وتطلب منك تأكيد رقمك الجامعي وإعادة تعيين كلمة المرور باستخدام ملف مرفق.

ماذا ستفعل؟`,
    },
    options: [
      {
        id: "S3O1",
        en: "Open attachment and follow instructions quickly.",
        ar: "فتح الملف المرفق وتنفيذ التعليمات بسرعة.",
      },
      {
        id: "S3O2",
        en: "Verify through official Moodle/department contact first.",
        ar: "التحقق أولًا من خلال نظام إدارة التعلم الرسمي أو التواصل المباشر مع القسم/المدرس.",
      },
      {
        id: "S3O3",
        en: "Reply to the email and proceed if they reply.",
        ar: "الرد على البريد الإلكتروني والمتابعة إذا قام المرسل بالرد.",
      },
    ],
  },
  {
    key: "S4",
    order: 4,
    question: {
      en: "Which of the following passwords do you consider the strongest for a university account?",
      ar: "أي من كلمات المرور التالية تعتقد أنها الأقوى لاستخدامها في حساب جامعي؟",
    },
    options: [
      { id: "S4O1", en: "Ahmed@Gaza2026!", ar: "Ahmed@Gaza2026!" },
      { id: "S4O2", en: "Mohammed2026!", ar: "Mohammed2026!" },
      { id: "S4O3", en: "123456789012", ar: "123456789012" },
      { id: "S4O4", en: "ahmed1234567", ar: "ahmed1234567" },
    ],
  },
  {
    key: "S5",
    order: 5,
    question: {
      en: `You get an email:
“Your grades have been updated. Click here to view your grades .”
The email includes a “View Results” button and asks you to sign in after clicking it.

What would you do?`,
      ar: `تستلم رسالة بريد إلكتروني تقول:
«تم تحديث درجاتك. اضغط هنا لعرض درجتك.»
تحتوي الرسالة على زر “عرض النتيجة” وتطلب منك تسجيل الدخول بعد الضغط عليه.

ماذا ستفعل؟`,
    },
    options: [
      {
        id: "S5O1",
        en: "Type official website URL manually and check grades there.",
        ar: "كتابة عنوان الموقع الرسمي يدويًا والتحقق من الدرجات من خلاله.",
      },
      {
        id: "S5O2",
        en: "Click the link because grades are important.",
        ar: "الضغط على الرابط لأن الدرجات مهمة.",
      },
      {
        id: "S5O3",
        en: "Forward email to friends to warn them.",
        ar: "إعادة توجيه البريد الإلكتروني للأصدقاء لتحذيرهم.",
      },
    ],
  },
  {
    key: "S6",
    order: 6,
    question: {
      en: `An email says:
“Please review the attached invoice.”
The attachment name is:
Invoice.pdf.exe

What would you do?`,
      ar: `تصل رسالة بريد إلكتروني تقول:
«يرجى مراجعة الفاتورة المرفقة.»
واسم الملف المرفق هو:
Invoice.pdf.exe

ماذا ستفعل؟`,
    },
    options: [
      {
        id: "S6O1",
        en: "Report to IT/security and do not open attachment.",
        ar: "الإبلاغ عنه إلى مسؤول تقنية المعلومات/الأمن وعدم فتح الملف المرفق.",
      },
      {
        id: "S6O2",
        en: "Open the attachment to check what it is.",
        ar: "فتح الملف المرفق لمعرفة محتواه.",
      },
      {
        id: "S6O3",
        en: "Delete the email immediately.",
        ar: "حذف البريد الإلكتروني فورًا.",
      },
    ],
  },
  {
    key: "S7",
    order: 7,
    question: {
      en: `On campus, you connect to a Wi-Fi network and a page opens asking you to login with your university credentials, but the page design looks slightly different.

What would you do?`,
      ar: `أثناء وجودك في الجامعة، تتصل بشبكة الواي فاي وتظهر صفحة تطلب منك تسجيل الدخول باستخدام بيانات حسابك الجامعي، لكن تصميم الصفحة يبدو مختلفًا قليلًا عن المعتاد.

ماذا ستفعل؟`,
    },
    options: [
      {
        id: "S7O1",
        en: "Disconnect and ask IT/official staff for the correct Wi-Fi name/portal.",
        ar: "قطع الاتصال وسؤال مسؤول تقنية المعلومات أو موظف رسمي عن اسم الشبكة وصفحة الدخول الصحيحة.",
      },
      {
        id: "S7O2",
        en: "Enter credentials because you need internet quickly.",
        ar: "إدخال بيانات تسجيل الدخول لأنك تحتاج إلى الإنترنت بسرعة.",
      },
      {
        id: "S7O3",
        en: "Use mobile hotspot instead.",
        ar: "استخدام نقطة اتصال الهاتف بدلًا من ذلك.",
      },
    ],
  },
  {
    key: "S8",
    order: 8,
    question: {
      en: `You receive a message:
“We are verifying your account. Reply with the code you just received.”
You indeed received a verification code on your phone.

What would you do?`,
      ar: `تستلم رسالة تقول:
«نقوم بالتحقق من حسابك. أرسل لنا رمز التحقق الذي وصل إليك للتو.»
وبالفعل، وصل إلى هاتفك رمز تحقق.

ماذا ستفعل؟`,
    },
    options: [
      {
        id: "S8O1",
        en: "Share the code to finish verification.",
        ar: "مشاركة الرمز لإكمال عملية التحقق.",
      },
      {
        id: "S8O2",
        en: "Do not share; login to official site manually and review security settings.",
        ar: "عدم مشاركة الرمز، والدخول يدويًا إلى الموقع الرسمي ومراجعة إعدادات الأمان.",
      },
      {
        id: "S8O3",
        en: "Ignore and change password later.",
        ar: "تجاهل الرسالة وتغيير كلمة المرور لاحقًا.",
      },
    ],
  },
] as const satisfies readonly AssessmentScenario[];

export const scenarioKeys = assessmentScenarios.map(
  ({ key }) => key,
) as readonly ScenarioKey[];

export function isScenarioKey(value: string): value is ScenarioKey {
  return scenarioKeys.includes(value as ScenarioKey);
}
