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
    languageToggle: "Choose interface language",
    common: {
      preview: "Interface preview",
      home: "CyberAwareGaza home",
      primaryNavigation: "Primary navigation",
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
      participantDashboard: "Participant dashboard",
      participantAccess: "Participant access",
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
      highlightsLabel: "Assessment highlights",
      highlights: [
        {
          badge: "8 questions",
          title: "8 Scenarios",
          text: "Eight scenario questions cover realistic cybersecurity decisions in academic and everyday settings.",
        },
        {
          badge: "At your pace",
          title: "About 5 Minutes",
          text: "A focused eight-question flow designed to be brief. Completion time varies by participant.",
        },
        {
          badge: "Risk level",
          title: "Personalized Result",
          text: "Completed assessments use the installed scoring rubric to show the resulting risk level on the participant dashboard.",
        },
        {
          badge: "Consent-led",
          title: "Educational & Research",
          text: "An educational assessment with voluntary consent controls for using eligible responses in research analysis.",
        },
      ],
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
      adminLogin: "Administrator login",
      adminIntro:
        "Use a privately provisioned administrator account. Public signup never grants administrative access.",
      loginIntro: "Sign in with the username and password you created.",
      create: "Create your account",
      createIntro:
        "Your account lets you return to your completed assessment results.",
      username: "Username",
      displayName: "Display name (optional)",
      password: "Password",
      confirm: "Confirm password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      signIn: "Sign in",
      adminSignIn: "Sign in to administration",
      submitCreate: "Create account",
      submitting: "Please wait…",
      signOut: "Sign out",
      signingOut: "Signing out…",
      noEmail:
        "We never ask for email, phone number, or institutional credentials.",
      anonymous: "Continue anonymously",
      anonTitle: "Temporary anonymous session",
      anonIntro:
        "This temporary session cannot be recovered after logout or server expiry. Some browsers can restore session cookies, but the server-side maximum still applies.",
      warningTitle: "Before you continue",
      warning:
        "Never enter real passwords, one-time codes, university credentials, or sensitive personal information anywhere in this assessment.",
      acknowledge: "I understand — continue",
      temporaryIconLabel: "Temporary session warning and expiry",
      validation: {
        username: "Use 3–40 letters, numbers, dots, underscores, or hyphens.",
        displayName: "Use no more than 120 characters.",
        password: "Use a password between 8 and 128 characters.",
        confirm: "Enter the same password again.",
      },
      errors: {
        invalid_input: "Check the highlighted fields and try again.",
        invalid_credentials: "The username or password is incorrect.",
        signup_unavailable:
          "An account could not be created with those details.",
        rate_limited: "Too many attempts. Please wait and try again.",
        forbidden: "This request could not be verified. Refresh and try again.",
        session_required: "Please sign in to continue.",
        server_error: "The request could not be completed. Please try again.",
      },
    },
    home: {
      eyebrow: "Participant area",
      welcome: "Welcome, {name}",
      registeredIntro:
        "Your participant profile is active. You can start or resume the assessment below.",
      anonymousIntro:
        "Your temporary participant profile is active for this browser session, subject to its server-enforced expiry.",
      registeredStatus: "Registered session active",
      anonymousStatus: "Temporary session active",
      assessmentStatus: "Assessment Status",
      notStarted: "Not Started",
      inProgress: "In Progress",
      completed: "Completed",
      attempts: "Attempts",
      securityRate: "Security rate",
      notRatedYet: "Not rated yet",
      lowRisk: "Low Risk",
      mediumRisk: "Medium Risk",
      highRisk: "High Risk",
      anonymousWarningTitle: "Temporary access",
      anonymousWarning:
        "This session cannot be recovered after logout or expiry. Closing a tab does not reliably end a browser session, so use Sign out on a shared device.",
      assessmentTitle: "Cybersecurity awareness assessment",
      assessmentPending:
        "Your answers are saved securely as you move through the eight scenarios.",
      startAssessment: "Start assessment",
      resumeAssessment: "Resume assessment",
      retakeAssessment: "Take assessment again",
      assessmentDetails:
        "Review the consent information, read the instructions, then answer one scenario at a time.",
      historyTitle: "Result history",
      historyRegistered:
        "Your completed assessment results will appear here. No result has been recorded yet.",
      historyAnonymous:
        "A completed result will be visible only while this temporary session remains active.",
      noHistory: "No results yet",
      resultNumber: "Assessment {number}",
      rawScoreShort: "Raw score",
      viewResult: "View your result",
      sessionLimitTitle: "About this temporary session",
    },
    assessment: {
      eyebrow: "Participant assessment",
      title: "Cybersecurity Awareness Assessment",
      intro:
        "This preview remains available for visual regression coverage of the disabled question state.",
      questionText:
        "Assessment content is available in the authorized participant flow.",
      optionPlaceholder: "Disabled preview answer",
      sourceNote:
        "This preview does not create or submit an assessment attempt.",
      consentTitle: "Voluntary participation",
      consentQuestion:
        "Do you voluntarily agree to participate in this research questionnaire?",
      consentLegend: "Choose one consent option",
      agree: "Yes, I agree.",
      decline: "No, I do not agree.",
      continue: "Continue",
      declinedTitle: "Your choice has been respected",
      declinedText:
        "The assessment has not started and no answers were submitted.",
      returnHome: "Return Home",
      instructionsTitle: "Cybersecurity Awareness Assessment",
      instructionsIntro:
        "You will review eight scenarios. For each one, choose what you would most likely do in real life.",
      instructionsSafety:
        "Do not enter any real password, verification code, university credentials, or other sensitive information.",
      instructionsPrivacy:
        "Your progress is saved to this authorized participant session.",
      begin: "Begin Scenario 1",
      progressLabel: "Assessment progress",
      progressText: "Scenario {current} of 8",
      questionLabel: "Choose one answer",
      previous: "Previous scenario",
      next: "Next scenario",
      submit: "Submit Assessment",
      saving: "Saving answer…",
      submitting: "Submitting assessment…",
      saved: "Answer saved",
      leaveEyebrow: "Leave assessment?",
      leaveTitle: "Your assessment is still in progress",
      leaveText:
        "You are about to return to the landing page. Answers that finished saving can be resumed while this participant session remains active. A choice that is still saving may not be stored.",
      stay: "Stay on assessment",
      leave: "Leave assessment",
      submittedTitle: "Assessment submitted",
      submittedText:
        "Your eight answers were scored and recorded securely. Preparing your dashboard…",
      errors: {
        invalid_input: "Choose a valid answer and try again.",
        forbidden: "This assessment does not belong to your session.",
        session_required: "Your session ended. Sign in again to continue.",
        content_unavailable:
          "The approved assessment content is temporarily unavailable.",
        consent_required:
          "Consent is required before the assessment can start.",
        attempt_not_found: "This assessment could not be resumed.",
        attempt_completed: "This assessment has already been submitted.",
        incomplete_answers: "Answer all eight scenarios before submitting.",
        scoring_unavailable:
          "Your eight answers are saved, but final scoring is unavailable until the approved rubric is installed. Nothing has been scored or submitted as complete.",
        server_error: "The request could not be completed. Please try again.",
      },
    },
    result: {
      eyebrow: "Result shell",
      title: "Your assessment result",
      subtitle:
        "A traceable summary of your eight cybersecurity awareness decisions.",
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
      submittedAt: "Submitted",
      completion: "Completion",
      eightOfEight: "8/8 scenarios",
      retake: "Take assessment again",
      returnHome: "Return Home",
      lowRisk: "Low Risk",
      mediumRisk: "Medium Risk",
      highRisk: "High Risk",
      lowInterpretation:
        "Your choices were predominantly protective across this scenario set. Keep verifying requests independently and continue using official channels.",
      mediumInterpretation:
        "Your choices mixed protective and risk-exposing decisions. Review the scenario guidance below and reinforce the habits that reduce exposure.",
      highInterpretation:
        "Your choices showed a stronger concentration of risk-exposing decisions. Work through the safer actions below and practice verification before acting.",
      rawScore: "Raw cumulative score",
      rawCumulative: "Raw cumulative score",
      possibleRange: "Possible raw range:",
      visualScale: "Visual position: {position}% of the possible raw range",
      visualScaleAria:
        "Raw score position is {position} percent along the possible range from {minimum} to {maximum}.",
      rawScoreNote:
        "This is a raw cumulative score from −76 to 80. It is not a percentage or a 0–100 grade.",
      interpretationTitle: "What this risk level means",
      reviewIntro:
        "Review the exact answer you selected, its score contribution, and a safer action for every scenario.",
      eightScenarios: "8 completed scenarios",
      scenario: "Scenario {number}",
      selectedAnswer: "Your selected answer",
      scoreContribution: "Score contribution shown for this decision",
      whyItMatters: "Why this matters",
      saferAction: "Educational guidance and safer action",
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
      dashboard: "Administration dashboard",
      dashboardIntro:
        "A source-aware administration shell with no connected research records or invented statistics.",
      previewNotice: "Preview data is intentionally empty",
      previewText:
        "Counts and charts stay blank until authorized queries and denominator rules are implemented in later phases.",
      signedInAs: "Signed in securely as {name}.",
      secureSession: "Administrator session",
      emptyNotice: "Research data remains intentionally unavailable",
      emptyText:
        "This Phase 3 route now enforces administrator authorization. Participant data and analytics are implemented in later phases.",
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
    languageToggle: "اختر لغة الواجهة",
    common: {
      preview: "معاينة الواجهة",
      home: "الصفحة الرئيسية لمنصة CyberAwareGaza",
      primaryNavigation: "التنقل الرئيسي",
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
      participantDashboard: "لوحة المشارك",
      participantAccess: "دخول المشارك",
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
      highlightsLabel: "مزايا التقييم",
      highlights: [
        {
          badge: "8 أسئلة",
          title: "8 سيناريوهات",
          text: "ثمانية أسئلة مبنية على سيناريوهات واقعية لاتخاذ قرارات الأمن السيبراني في البيئات الأكاديمية والحياة اليومية.",
        },
        {
          badge: "وفق سرعتك",
          title: "نحو 5 دقائق",
          text: "مسار مركز من ثمانية أسئلة صُمم ليكون موجزًا، بينما يختلف وقت الإكمال من مشارك إلى آخر.",
        },
        {
          badge: "مستوى المخاطر",
          title: "نتيجة مخصصة",
          text: "تستخدم التقييمات المكتملة معيار الدرجات المثبت لعرض مستوى المخاطر الناتج في لوحة المشارك.",
        },
        {
          badge: "بموافقة طوعية",
          title: "تعليمي وبحثي",
          text: "تقييم تعليمي يطبق ضوابط الموافقة الطوعية عند استخدام الاستجابات المؤهلة في التحليل البحثي.",
        },
      ],
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
      adminLogin: "دخول مسؤول النظام",
      adminIntro:
        "استخدم حساب مسؤول تم إنشاؤه بصورة خاصة. لا يمنح التسجيل العام صلاحية الإدارة مطلقًا.",
      loginIntro: "سجّل الدخول باسم المستخدم وكلمة المرور اللذين أنشأتهما.",
      create: "أنشئ حسابك",
      createIntro: "يتيح لك الحساب العودة إلى نتائج تقييماتك المكتملة.",
      username: "اسم المستخدم",
      displayName: "الاسم الظاهر (اختياري)",
      password: "كلمة المرور",
      confirm: "تأكيد كلمة المرور",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      signIn: "تسجيل الدخول",
      adminSignIn: "الدخول إلى الإدارة",
      submitCreate: "إنشاء الحساب",
      submitting: "يرجى الانتظار…",
      signOut: "تسجيل الخروج",
      signingOut: "جارٍ تسجيل الخروج…",
      noEmail: "لن نطلب بريدًا إلكترونيًا أو رقم هاتف أو بيانات اعتماد مؤسسية.",
      anonymous: "المتابعة دون حساب",
      anonTitle: "جلسة مؤقتة مجهولة الهوية",
      anonIntro:
        "لا يمكن استعادة هذه الجلسة المؤقتة بعد تسجيل الخروج أو انتهاء صلاحيتها على الخادم. قد تستعيد بعض المتصفحات ملفات جلسة الارتباط، لكن الحد الأقصى على الخادم يظل نافذًا.",
      warningTitle: "قبل المتابعة",
      warning:
        "لا تدخل أبدًا كلمات مرور حقيقية أو رموز تحقق أو بيانات اعتماد جامعية أو معلومات شخصية حساسة في أي جزء من هذا التقييم.",
      acknowledge: "فهمت — متابعة",
      temporaryIconLabel: "تنبيه الجلسة المؤقتة وانتهاء صلاحيتها",
      validation: {
        username:
          "استخدم من 3 إلى 40 حرفًا أو رقمًا أو نقطة أو شرطة سفلية أو واصلة.",
        displayName: "استخدم 120 حرفًا كحد أقصى.",
        password: "استخدم كلمة مرور طولها من 8 إلى 128 حرفًا.",
        confirm: "أدخل كلمة المرور نفسها مرة أخرى.",
      },
      errors: {
        invalid_input: "تحقق من الحقول المحددة ثم حاول مرة أخرى.",
        invalid_credentials: "اسم المستخدم أو كلمة المرور غير صحيح.",
        signup_unavailable: "تعذر إنشاء حساب بهذه البيانات.",
        rate_limited: "محاولات كثيرة جدًا. انتظر ثم حاول مرة أخرى.",
        forbidden: "تعذر التحقق من الطلب. حدّث الصفحة ثم حاول مرة أخرى.",
        session_required: "سجّل الدخول للمتابعة.",
        server_error: "تعذر إكمال الطلب. يرجى المحاولة مرة أخرى.",
      },
    },
    home: {
      eyebrow: "منطقة المشارك",
      welcome: "مرحبًا، {name}",
      registeredIntro:
        "ملف المشارك الخاص بك فعّال. يمكنك بدء التقييم أو متابعته أدناه.",
      anonymousIntro:
        "ملف المشارك المؤقت فعّال في جلسة المتصفح هذه ويخضع لانتهاء الصلاحية المفروض من الخادم.",
      registeredStatus: "جلسة مسجلة فعّالة",
      anonymousStatus: "جلسة مؤقتة فعّالة",
      assessmentStatus: "حالة التقييم",
      notStarted: "لم يبدأ",
      inProgress: "قيد التقدم",
      completed: "مكتمل",
      attempts: "المحاولات",
      securityRate: "معدل الأمان",
      notRatedYet: "لم يُقيَّم بعد",
      lowRisk: "مخاطر منخفضة",
      mediumRisk: "مخاطر متوسطة",
      highRisk: "مخاطر مرتفعة",
      anonymousWarningTitle: "وصول مؤقت",
      anonymousWarning:
        "لا يمكن استعادة هذه الجلسة بعد تسجيل الخروج أو انتهاء الصلاحية. إغلاق علامة التبويب لا ينهي جلسة المتصفح بصورة موثوقة، لذا استخدم تسجيل الخروج على الجهاز المشترك.",
      assessmentTitle: "تقييم الوعي بالأمن السيبراني",
      assessmentPending:
        "تُحفظ إجاباتك بأمان أثناء انتقالك بين السيناريوهات الثمانية.",
      startAssessment: "ابدأ التقييم",
      resumeAssessment: "متابعة التقييم",
      retakeAssessment: "إجراء التقييم مرة أخرى",
      assessmentDetails:
        "راجع معلومات الموافقة واقرأ التعليمات، ثم أجب عن سيناريو واحد في كل شاشة.",
      historyTitle: "سجل النتائج",
      historyRegistered:
        "ستظهر نتائج تقييماتك المكتملة هنا. لم تُسجل أي نتيجة بعد.",
      historyAnonymous:
        "ستبقى النتيجة المكتملة متاحة فقط ما دامت هذه الجلسة المؤقتة فعّالة.",
      noHistory: "لا توجد نتائج بعد",
      resultNumber: "التقييم {number}",
      rawScoreShort: "الدرجة الخام",
      viewResult: "عرض نتيجتك",
      sessionLimitTitle: "حول هذه الجلسة المؤقتة",
    },
    assessment: {
      eyebrow: "تقييم المشارك",
      title: "تقييم الوعي بالأمن السيبراني",
      intro: "تبقى هذه المعاينة متاحة لاختبار الحالة المرئية للسؤال المعطل.",
      questionText: "يتوفر محتوى التقييم في مسار المشارك المصرح به.",
      optionPlaceholder: "إجابة معاينة معطلة",
      sourceNote: "لا تنشئ هذه المعاينة محاولة تقييم ولا ترسلها.",
      consentTitle: "المشاركة الطوعية",
      consentQuestion: "هل توافق طوعًا على المشاركة في هذا الاستبيان البحثي؟",
      consentLegend: "اختر أحد خياري الموافقة",
      agree: "نعم، أوافق.",
      decline: "لا، لا أوافق.",
      continue: "متابعة",
      declinedTitle: "تم احترام اختيارك",
      declinedText: "لم يبدأ التقييم ولم يتم إرسال أي إجابات.",
      returnHome: "العودة إلى الصفحة الرئيسية",
      instructionsTitle: "تقييم الوعي بالأمن السيبراني",
      instructionsIntro:
        "ستراجع ثمانية سيناريوهات. اختر في كل منها ما يُرجح أن تفعله في الحياة الواقعية.",
      instructionsSafety:
        "لا تُدخل أي كلمة مرور حقيقية أو رمز تحقق أو بيانات اعتماد جامعية أو معلومات حساسة أخرى.",
      instructionsPrivacy: "يُحفظ تقدمك في جلسة المشارك المصرح بها.",
      begin: "ابدأ السيناريو 1",
      progressLabel: "تقدم التقييم",
      progressText: "السيناريو {current} من 8",
      questionLabel: "اختر إجابة واحدة",
      previous: "السيناريو السابق",
      next: "السيناريو التالي",
      submit: "إرسال التقييم",
      saving: "جارٍ حفظ الإجابة…",
      submitting: "جارٍ إرسال التقييم…",
      saved: "تم حفظ الإجابة",
      leaveEyebrow: "مغادرة التقييم؟",
      leaveTitle: "لا يزال تقييمك قيد التقدم",
      leaveText:
        "أنت على وشك العودة إلى الصفحة الرئيسية. يمكن استئناف الإجابات التي ظهرت بجانبها عبارة «تم حفظ الإجابة» ما دامت جلسة المشارك هذه فعّالة. قد لا يُحفظ الخيار الذي لا يزال قيد الحفظ.",
      stay: "البقاء في التقييم",
      leave: "مغادرة التقييم",
      submittedTitle: "تم إرسال التقييم",
      submittedText:
        "تم احتساب درجات إجاباتك الثمانية وتسجيلها بأمان. جارٍ تجهيز لوحة المشارك…",
      errors: {
        invalid_input: "اختر إجابة صالحة ثم حاول مرة أخرى.",
        forbidden: "هذا التقييم لا يتبع جلستك.",
        session_required: "انتهت جلستك. سجّل الدخول مجددًا للمتابعة.",
        content_unavailable: "محتوى التقييم المعتمد غير متاح مؤقتًا.",
        consent_required: "الموافقة مطلوبة قبل بدء التقييم.",
        attempt_not_found: "تعذر استئناف هذا التقييم.",
        attempt_completed: "تم إرسال هذا التقييم مسبقًا.",
        incomplete_answers: "أجب عن السيناريوهات الثمانية قبل الإرسال.",
        scoring_unavailable:
          "تم حفظ إجاباتك الثمانية، لكن التقييم النهائي غير متاح حتى تثبيت معيار الدرجات المعتمد. لم تُحسب درجة ولم يُسجّل التقييم كمكتمل.",
        server_error: "تعذر إكمال الطلب. يرجى المحاولة مرة أخرى.",
      },
    },
    result: {
      eyebrow: "نموذج النتيجة",
      title: "نتيجة تقييمك",
      subtitle: "ملخص قابل للتتبع لقراراتك الثمانية في الوعي بالأمن السيبراني.",
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
      submittedAt: "وقت الإرسال",
      completion: "الإكمال",
      eightOfEight: "8/8 سيناريوهات",
      retake: "إجراء التقييم مرة أخرى",
      returnHome: "العودة إلى الصفحة الرئيسية",
      lowRisk: "مخاطر منخفضة",
      mediumRisk: "مخاطر متوسطة",
      highRisk: "مخاطر مرتفعة",
      lowInterpretation:
        "كانت اختياراتك وقائية في الغالب ضمن هذه السيناريوهات. واصل التحقق المستقل من الطلبات واستخدام القنوات الرسمية.",
      mediumInterpretation:
        "جمعت اختياراتك بين قرارات وقائية وأخرى تعرضك للمخاطر. راجع إرشادات السيناريوهات أدناه وعزز العادات التي تقلل التعرض.",
      highInterpretation:
        "أظهرت اختياراتك تركيزًا أكبر من القرارات التي تعرضك للمخاطر. طبّق الإجراءات الأكثر أمانًا أدناه وتدرّب على التحقق قبل التصرف.",
      rawScore: "الدرجة التراكمية الخام",
      rawCumulative: "الدرجة التراكمية الخام",
      possibleRange: "النطاق الخام الممكن:",
      visualScale: "الموضع البصري: {position}% من النطاق الخام الممكن",
      visualScaleAria:
        "موضع الدرجة الخام هو {position} بالمئة ضمن النطاق الممكن من {minimum} إلى {maximum}.",
      rawScoreNote:
        "هذه درجة تراكمية خام من −76 إلى 80، وليست نسبة مئوية ولا درجة من 0 إلى 100.",
      interpretationTitle: "ماذا يعني مستوى المخاطر هذا؟",
      reviewIntro:
        "راجع الإجابة التي اخترتها بالضبط، ومساهمتها في الدرجة، وإجراءً أكثر أمانًا لكل سيناريو.",
      eightScenarios: "8 سيناريوهات مكتملة",
      scenario: "السيناريو {number}",
      selectedAnswer: "إجابتك المختارة",
      scoreContribution: "مساهمة هذا القرار في الدرجة",
      whyItMatters: "لماذا يهم هذا؟",
      saferAction: "إرشاد تعليمي وإجراء أكثر أمانًا",
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
      dashboard: "لوحة تحكم الإدارة",
      dashboardIntro:
        "نموذج إدارة يراعي مصدر البيانات دون سجلات بحثية متصلة أو إحصاءات مختلقة.",
      previewNotice: "بيانات المعاينة فارغة عمدًا",
      previewText:
        "تبقى الأعداد والرسوم فارغة حتى تنفيذ الاستعلامات المصرح بها وقواعد المقام في المراحل اللاحقة.",
      signedInAs: "تم تسجيل الدخول بأمان باسم {name}.",
      secureSession: "جلسة مسؤول النظام",
      emptyNotice: "بيانات البحث غير متاحة عمدًا",
      emptyText:
        "يفرض مسار المرحلة الثالثة الآن صلاحية مسؤول النظام. تُنفذ بيانات المشاركين والتحليلات في مراحل لاحقة.",
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
