export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

const dictionaries = {
  en: {
    skip: "Skip to main content",
    language: "العربية",
    languageAria: "Switch to Arabic",
    common: {
      preview: "Interface preview",
      menu: "Menu",
      close: "Close",
      back: "Back",
      retry: "Try again",
      loading: "Loading",
      empty: "Empty",
      error: "Error",
    },
    nav: {
      about: "About",
      how: "How it works",
      login: "Log in",
      signup: "Create account",
      start: "Start assessment",
      assessmentPreview: "Question preview",
      resultPreview: "Result preview",
      adminPreview: "Admin preview",
    },
    landing: {
      eyebrow: "Cybersecurity awareness assessment",
      title: "Eight decisions. One clearer view of your cyber risk.",
      intro:
        "A bilingual educational assessment for academic institutions in Gaza. Respond to realistic situations, receive an explainable result, and learn safer habits without sharing real credentials.",
      privacy:
        "No email, phone number, university ID, password, or one-time code is requested.",
      overview: "What to expect",
      overviewText:
        "You will review eight scenarios, choose the action you would realistically take, and receive feedback only after submitting all answers.",
      steps: [
        [
          "Choose how to enter",
          "Use a participant account or continue with a temporary anonymous session.",
        ],
        [
          "Read and consent",
          "A clear warning and voluntary consent decision come before the assessment.",
        ],
        [
          "Review your result",
          "Your score is calculated on the server from the approved, versioned rubric.",
        ],
      ],
      research: "Educational and research use",
      researchText:
        "The platform separates website submissions from historical form data and excludes non-consenting responses from research analysis.",
      shellsTitle: "Preview the interface system",
      shellsText:
        "These source-safe shells demonstrate layout and accessibility only. They do not submit answers, calculate scores, or expose research analytics.",
      scenarioLabel: "scenarios",
    },
    start: {
      eyebrow: "Choose your path",
      title: "How would you like to continue?",
      intro:
        "Participant accounts can return to past results. Anonymous sessions are temporary and cannot be restored after they end.",
      loginTitle: "Log in",
      loginText: "Continue with an existing username and password.",
      signupTitle: "Create account",
      signupText: "Choose a username. No email or phone number is needed.",
      anonTitle: "Continue anonymously",
      anonText:
        "Use a temporary session and view the result only while it remains active.",
      continue: "Continue",
    },
    auth: {
      participantLogin: "Participant login",
      loginIntro: "Sign in with the username and password you created.",
      create: "Create your account",
      createIntro:
        "Your account lets you return to your completed assessment results.",
      username: "Username",
      displayName: "Display name (optional)",
      password: "Password",
      confirm: "Confirm password",
      signIn: "Sign in",
      submitCreate: "Create account",
      noEmail:
        "We never ask for email, phone number, or institutional credentials.",
      anonymous: "Continue anonymously",
      anonTitle: "Temporary anonymous session",
      anonIntro:
        "Your result is available only in this browser session. Ending the session revokes access; it cannot be recovered later.",
      warningTitle: "Before you continue",
      warning:
        "Never enter real passwords, one-time codes, university credentials, or sensitive personal information anywhere in this assessment.",
      acknowledge: "I understand — continue",
      unavailable:
        "Visual preview only. Account and session actions are implemented in Phase 3.",
    },
    assessment: {
      eyebrow: "Assessment shell",
      title: "Scenario layout preview",
      intro:
        "This screen establishes the one-question layout without publishing or paraphrasing assessment content.",
      progressLabel: "Assessment progress",
      progressText: "Scenario 1 of 8",
      questionLabel: "Scenario content placeholder",
      questionText:
        "The exact approved scenario wording will appear here when Phase 4 content is transcribed and verified.",
      optionPlaceholder: "Approved response option will appear here",
      previous: "Previous scenario",
      next: "Next scenario",
      sourceNote:
        "Question and answer controls are intentionally disabled in this Phase 2 preview.",
    },
    result: {
      eyebrow: "Result shell",
      title: "Your assessment result",
      previewBadge: "Preview — no calculated result",
      emptyTitle: "No assessment result yet",
      emptyText:
        "A verified score, risk label, interpretation, and answer review will appear only after scoring is implemented and a real assessment is completed.",
      scoreLabel: "Score",
      riskLabel: "Risk level",
      unavailable: "Not calculated",
      feedbackTitle: "Personalized guidance",
      feedbackText:
        "Guidance remains empty until the legacy scoring and feedback source is verified.",
      reviewTitle: "Answer review",
      reviewText:
        "Completed scenario responses will be listed here without revealing correctness before submission.",
      start: "Return to entry options",
    },
    admin: {
      brandLabel: "Research administration",
      openMenu: "Open admin navigation",
      closeMenu: "Close admin navigation",
      overview: "Overview",
      participants: "Participants",
      assessments: "Assessments",
      scenarios: "Scenario analytics",
      imports: "Imports and exports",
      settings: "Settings",
      dashboard: "Dashboard preview",
      dashboardIntro:
        "A source-aware administration shell with no connected research records or invented statistics.",
      previewNotice: "Preview data is intentionally empty",
      previewText:
        "Counts and charts stay blank until authorized queries and denominator rules are implemented in later phases.",
      kpis: [
        "Eligible participants",
        "Completed assessments",
        "Average score",
        "Risk distribution",
      ],
      notAvailable: "No live data",
      recentTitle: "Recent assessments",
      recentText:
        "Authorized assessment records will appear here with source, consent eligibility, and timezone-aware timestamps.",
      fileHint:
        "Imported filenames such as responses.csv remain left-to-right.",
      viewLoading: "Preview loading state",
      viewEmpty: "Preview empty state",
      viewError: "Preview error state",
    },
    states: {
      loadingTitle: "Loading secure data",
      loadingText:
        "The interface is waiting for an authorized server response. No placeholder totals are shown.",
      emptyTitle: "Nothing to show yet",
      emptyText:
        "This area will remain empty until eligible records exist for the selected source and consent rules.",
      errorTitle: "Data could not be loaded",
      errorText:
        "The preview demonstrates a recoverable error without exposing database or participant details.",
    },
    modal: {
      trigger: "Preview safety notice",
      eyebrow: "Safety notice",
      title: "Protect your real credentials",
      text: "CyberAwareGaza scenarios should never ask you to enter a real password, one-time code, or institutional credential.",
      close: "Close notice",
    },
    gate: {
      title: "Protected assessment content",
      text: "The visual shell is ready, while exact scenarios, scoring, and feedback remain gated for their approved implementation phases.",
    },
    footer: "Educational cybersecurity awareness and research platform",
  },
  ar: {
    skip: "انتقل إلى المحتوى الرئيسي",
    language: "English",
    languageAria: "التبديل إلى الإنجليزية",
    common: {
      preview: "معاينة الواجهة",
      menu: "القائمة",
      close: "إغلاق",
      back: "رجوع",
      retry: "إعادة المحاولة",
      loading: "تحميل",
      empty: "فارغ",
      error: "خطأ",
    },
    nav: {
      about: "عن المنصة",
      how: "آلية العمل",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      start: "ابدأ التقييم",
      assessmentPreview: "معاينة السؤال",
      resultPreview: "معاينة النتيجة",
      adminPreview: "معاينة الإدارة",
    },
    landing: {
      eyebrow: "تقييم الوعي بالأمن السيبراني",
      title: "ثمانية قرارات تمنحك رؤية أوضح لمخاطرك السيبرانية.",
      intro:
        "تقييم تعليمي ثنائي اللغة للمؤسسات الأكاديمية في غزة. تعامل مع مواقف واقعية، واحصل على نتيجة قابلة للتفسير، وتعلّم عادات أكثر أمانًا دون مشاركة بيانات دخول حقيقية.",
      privacy:
        "لن نطلب بريدًا إلكترونيًا أو رقم هاتف أو رقمًا جامعيًا أو كلمة مرور أو رمز تحقق.",
      overview: "ما الذي ستقوم به؟",
      overviewText:
        "ستراجع ثمانية سيناريوهات، وتختار الإجراء الذي ستتخذه واقعيًا، ثم تحصل على التغذية الراجعة بعد إرسال جميع الإجابات فقط.",
      steps: [
        [
          "اختر طريقة الدخول",
          "استخدم حساب مشارك أو تابع من خلال جلسة مؤقتة مجهولة الهوية.",
        ],
        ["اقرأ ووافق", "يظهر تحذير واضح وقرار موافقة طوعية قبل بدء التقييم."],
        [
          "راجع نتيجتك",
          "تُحسب النتيجة على الخادم باستخدام معيار معتمد ومحدد الإصدار.",
        ],
      ],
      research: "للاستخدام التعليمي والبحثي",
      researchText:
        "تفصل المنصة بين مشاركات الموقع وبيانات النماذج التاريخية، وتستبعد الردود غير الموافقة من التحليل البحثي.",
      shellsTitle: "استعرض نظام الواجهة",
      shellsText:
        "توضح هذه النماذج الآمنة تخطيط الواجهة وإتاحتها فقط، ولا ترسل إجابات أو تحسب درجات أو تعرض تحليلات بحثية.",
      scenarioLabel: "سيناريوهات",
    },
    start: {
      eyebrow: "اختر مسارك",
      title: "كيف ترغب في المتابعة؟",
      intro:
        "يمكن لأصحاب الحسابات العودة إلى نتائجهم السابقة. الجلسات المجهولة مؤقتة ولا يمكن استعادتها بعد انتهائها.",
      loginTitle: "تسجيل الدخول",
      loginText: "تابع باستخدام اسم المستخدم وكلمة المرور الحاليين.",
      signupTitle: "إنشاء حساب",
      signupText: "اختر اسم مستخدم. لا حاجة إلى بريد إلكتروني أو رقم هاتف.",
      anonTitle: "المتابعة دون حساب",
      anonText: "استخدم جلسة مؤقتة واعرض النتيجة ما دامت الجلسة فعالة فقط.",
      continue: "متابعة",
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
      anonIntro:
        "تظل نتيجتك متاحة في جلسة المتصفح هذه فقط. إنهاء الجلسة يلغي الوصول ولا يمكن استعادتها لاحقًا.",
      warningTitle: "قبل المتابعة",
      warning:
        "لا تدخل أبدًا كلمات مرور حقيقية أو رموز تحقق أو بيانات اعتماد جامعية أو معلومات شخصية حساسة في أي جزء من هذا التقييم.",
      acknowledge: "فهمت — متابعة",
      unavailable:
        "هذه معاينة مرئية فقط. تُنفّذ إجراءات الحساب والجلسة في المرحلة الثالثة.",
    },
    assessment: {
      eyebrow: "نموذج التقييم",
      title: "معاينة تخطيط السيناريو",
      intro:
        "تحدد هذه الشاشة تخطيط السؤال الواحد دون نشر محتوى التقييم أو إعادة صياغته.",
      progressLabel: "تقدم التقييم",
      progressText: "السيناريو 1 من 8",
      questionLabel: "موضع محتوى السيناريو",
      questionText:
        "سيظهر هنا نص السيناريو المعتمد حرفيًا بعد نسخه والتحقق منه في المرحلة الرابعة.",
      optionPlaceholder: "سيظهر هنا خيار الإجابة المعتمد",
      previous: "السيناريو السابق",
      next: "السيناريو التالي",
      sourceNote:
        "عناصر السؤال والإجابة معطلة عمدًا في معاينة المرحلة الثانية.",
    },
    result: {
      eyebrow: "نموذج النتيجة",
      title: "نتيجة تقييمك",
      previewBadge: "معاينة — لا توجد نتيجة محسوبة",
      emptyTitle: "لا توجد نتيجة تقييم بعد",
      emptyText:
        "لن تظهر الدرجة أو مستوى المخاطر أو التفسير أو مراجعة الإجابات إلا بعد تنفيذ آلية التقييم وإكمال تقييم فعلي.",
      scoreLabel: "الدرجة",
      riskLabel: "مستوى المخاطر",
      unavailable: "غير محسوب",
      feedbackTitle: "إرشادات مخصصة",
      feedbackText:
        "تظل الإرشادات فارغة حتى التحقق من مصدر آلية التقييم والتغذية الراجعة القديمة.",
      reviewTitle: "مراجعة الإجابات",
      reviewText:
        "ستُعرض إجابات السيناريوهات المكتملة هنا دون كشف صحة الإجابة قبل الإرسال.",
      start: "العودة إلى خيارات الدخول",
    },
    admin: {
      brandLabel: "إدارة البحث",
      openMenu: "فتح تنقل الإدارة",
      closeMenu: "إغلاق تنقل الإدارة",
      overview: "نظرة عامة",
      participants: "المشاركون",
      assessments: "التقييمات",
      scenarios: "تحليلات السيناريوهات",
      imports: "الاستيراد والتصدير",
      settings: "الإعدادات",
      dashboard: "معاينة لوحة التحكم",
      dashboardIntro:
        "نموذج إدارة يراعي مصدر البيانات دون سجلات بحثية متصلة أو إحصاءات مختلقة.",
      previewNotice: "بيانات المعاينة فارغة عمدًا",
      previewText:
        "تبقى الأعداد والرسوم فارغة حتى تنفيذ الاستعلامات المصرح بها وقواعد المقام في المراحل اللاحقة.",
      kpis: [
        "المشاركون المؤهلون",
        "التقييمات المكتملة",
        "متوسط الدرجة",
        "توزيع المخاطر",
      ],
      notAvailable: "لا توجد بيانات فعلية",
      recentTitle: "التقييمات الحديثة",
      recentText:
        "ستظهر هنا سجلات التقييم المصرح بها مع المصدر وأهلية الموافقة والطابع الزمني المحدد المنطقة.",
      fileHint:
        "تبقى أسماء الملفات مثل responses.csv باتجاه من اليسار إلى اليمين.",
      viewLoading: "معاينة حالة التحميل",
      viewEmpty: "معاينة الحالة الفارغة",
      viewError: "معاينة حالة الخطأ",
    },
    states: {
      loadingTitle: "جارٍ تحميل البيانات الآمنة",
      loadingText:
        "تنتظر الواجهة استجابة مصرحًا بها من الخادم، ولا تعرض أرقامًا مؤقتة.",
      emptyTitle: "لا يوجد ما يُعرض بعد",
      emptyText:
        "ستبقى هذه المساحة فارغة حتى تتوفر سجلات مؤهلة للمصدر وقواعد الموافقة المحددة.",
      errorTitle: "تعذر تحميل البيانات",
      errorText:
        "توضح المعاينة خطأً يمكن التعافي منه دون كشف تفاصيل قاعدة البيانات أو المشاركين.",
    },
    modal: {
      trigger: "معاينة تنبيه السلامة",
      eyebrow: "تنبيه سلامة",
      title: "احمِ بيانات دخولك الحقيقية",
      text: "يجب ألا تطلب سيناريوهات CyberAwareGaza إدخال كلمة مرور حقيقية أو رمز تحقق أو بيانات اعتماد مؤسسية.",
      close: "إغلاق التنبيه",
    },
    gate: {
      title: "محتوى تقييم محمي",
      text: "النموذج المرئي جاهز، بينما تظل السيناريوهات الدقيقة وآلية التقييم والتغذية الراجعة مقيدة لمراحل تنفيذها المعتمدة.",
    },
    footer: "منصة تعليمية وبحثية للتوعية بالأمن السيبراني",
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
