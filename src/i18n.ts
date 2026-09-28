export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

const dictionaries = {
  en: {
    skip: "Skip to main content",
    nav: { about: "About", how: "How it works", login: "Log in", signup: "Create account", start: "Start assessment" },
    landing: {
      eyebrow: "Cybersecurity awareness assessment",
      title: "Eight decisions. One clearer view of your cyber risk.",
      intro: "A bilingual educational assessment for academic institutions in Gaza. Respond to realistic situations, receive an explainable result, and learn safer habits without sharing real credentials.",
      privacy: "No email, phone number, university ID, password, or one-time code is requested.",
      overview: "What to expect",
      overviewText: "You will review eight scenarios, choose the action you would realistically take, and receive feedback only after submitting all answers.",
      steps: [
        ["Choose how to enter", "Use a participant account or continue with a temporary anonymous session."],
        ["Read and consent", "A clear warning and voluntary consent decision come before the assessment."],
        ["Review your result", "Your score is calculated on the server from the approved, versioned rubric."]
      ],
      research: "Educational and research use",
      researchText: "The platform separates website submissions from historical form data and excludes non-consenting responses from research analysis."
    },
    start: {
      eyebrow: "Choose your path",
      title: "How would you like to continue?",
      intro: "Participant accounts can return to past results. Anonymous sessions are temporary and cannot be restored after they end.",
      loginTitle: "Log in",
      loginText: "Continue with an existing username and password.",
      signupTitle: "Create account",
      signupText: "Choose a username. No email or phone number is needed.",
      anonTitle: "Continue anonymously",
      anonText: "Use a temporary session and view the result only while it remains active.",
      continue: "Continue"
    },
    auth: {
      participantLogin: "Participant login",
      loginIntro: "Sign in with the username and password you created.",
      create: "Create your account",
      createIntro: "Your account lets you return to your completed assessment results.",
      username: "Username",
      displayName: "Display name (optional)",
      password: "Password",
      confirm: "Confirm password",
      signIn: "Sign in",
      submitCreate: "Create account",
      noEmail: "We never ask for email, phone number, or institutional credentials.",
      anonymous: "Continue anonymously",
      anonTitle: "Temporary anonymous session",
      anonIntro: "Your result is available only in this browser session. Ending the session revokes access; it cannot be recovered later.",
      warningTitle: "Before you continue",
      warning: "Never enter real passwords, one-time codes, university credentials, or sensitive personal information anywhere in this assessment.",
      acknowledge: "I understand — continue",
      unavailable: "Account and anonymous-session creation will be enabled after the development database is connected."
    },
    gate: {
      title: "Assessment content is awaiting source approval",
      text: "The interface and data safeguards are being prepared, but scenarios and scoring are intentionally unavailable until the canonical bilingual questionnaire and legacy scoring rubric are supplied and reconciled."
    },
    footer: "Educational cybersecurity awareness and research platform",
    language: "العربية"
  },
  ar: {
    skip: "انتقل إلى المحتوى الرئيسي",
    nav: { about: "عن المنصة", how: "آلية العمل", login: "تسجيل الدخول", signup: "إنشاء حساب", start: "ابدأ التقييم" },
    landing: {
      eyebrow: "تقييم الوعي بالأمن السيبراني",
      title: "ثمانية قرارات تمنحك رؤية أوضح لمخاطرك السيبرانية.",
      intro: "تقييم تعليمي ثنائي اللغة للمؤسسات الأكاديمية في غزة. تعامل مع مواقف واقعية، واحصل على نتيجة قابلة للتفسير، وتعلّم عادات أكثر أمانًا دون مشاركة بيانات دخول حقيقية.",
      privacy: "لن نطلب بريدًا إلكترونيًا أو رقم هاتف أو رقمًا جامعيًا أو كلمة مرور أو رمز تحقق.",
      overview: "ما الذي ستقوم به؟",
      overviewText: "ستراجع ثمانية سيناريوهات، وتختار الإجراء الذي ستتخذه واقعيًا، ثم تحصل على التغذية الراجعة بعد إرسال جميع الإجابات فقط.",
      steps: [
        ["اختر طريقة الدخول", "استخدم حساب مشارك أو تابع من خلال جلسة مؤقتة مجهولة الهوية."],
        ["اقرأ ووافق", "يظهر تحذير واضح وقرار موافقة طوعية قبل بدء التقييم."],
        ["راجع نتيجتك", "تُحسب النتيجة على الخادم باستخدام معيار معتمد ومحدد الإصدار."]
      ],
      research: "للاستخدام التعليمي والبحثي",
      researchText: "تفصل المنصة بين مشاركات الموقع وبيانات النماذج التاريخية، وتستبعد الردود غير الموافقة من التحليل البحثي."
    },
    start: {
      eyebrow: "اختر مسارك",
      title: "كيف ترغب في المتابعة؟",
      intro: "يمكن لأصحاب الحسابات العودة إلى نتائجهم السابقة. الجلسات المجهولة مؤقتة ولا يمكن استعادتها بعد انتهائها.",
      loginTitle: "تسجيل الدخول",
      loginText: "تابع باستخدام اسم المستخدم وكلمة المرور الحاليين.",
      signupTitle: "إنشاء حساب",
      signupText: "اختر اسم مستخدم. لا حاجة إلى بريد إلكتروني أو رقم هاتف.",
      anonTitle: "المتابعة دون حساب",
      anonText: "استخدم جلسة مؤقتة واعرض النتيجة ما دامت الجلسة فعالة فقط.",
      continue: "متابعة"
    },
    auth: {
      participantLogin: "دخول المشارك",
      loginIntro: "سجّل الدخول باسم المستخدم وكلمة المرور اللذين أنشأتهما.",
      create: "أنشئ حسابك",
      createIntro: "يتيح لك الحساب العودة إلى نتائج تقييماتك المكتملة.",
      username: "اسم المستخدم",
      displayName: "الاسم الظاهر (اختياري)",
      password: "كلمة المرور",
      confirm: "تأكيد كلمة المرور",
      signIn: "تسجيل الدخول",
      submitCreate: "إنشاء الحساب",
      noEmail: "لن نطلب بريدًا إلكترونيًا أو رقم هاتف أو بيانات اعتماد مؤسسية.",
      anonymous: "المتابعة دون حساب",
      anonTitle: "جلسة مؤقتة مجهولة الهوية",
      anonIntro: "تظل نتيجتك متاحة في جلسة المتصفح هذه فقط. إنهاء الجلسة يلغي الوصول ولا يمكن استعادتها لاحقًا.",
      warningTitle: "قبل المتابعة",
      warning: "لا تدخل أبدًا كلمات مرور حقيقية أو رموز تحقق أو بيانات اعتماد جامعية أو معلومات شخصية حساسة في أي جزء من هذا التقييم.",
      acknowledge: "فهمت — متابعة",
      unavailable: "سيتم تفعيل إنشاء الحسابات والجلسات المجهولة بعد ربط قاعدة بيانات التطوير."
    },
    gate: {
      title: "محتوى التقييم بانتظار اعتماد المصدر",
      text: "يجري إعداد الواجهة وضوابط حماية البيانات، لكن السيناريوهات وآلية احتساب الدرجات غير متاحتين عمدًا حتى توفير الاستبيان الثنائي اللغة ومعيار التقييم القديم ومراجعتهما."
    },
    footer: "منصة تعليمية وبحثية للتوعية بالأمن السيبراني",
    language: "English"
  }
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
