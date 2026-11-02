import type { Locale } from "@/src/i18n";

const copy = {
  en: {
    nav: "Feedbacks",
    title: "Usability Feedback",
    intro:
      "Participant feedback and usability evaluation insights collected after completing the cybersecurity awareness assessment.",
    received: "Feedback Received",
    submissions: "All submitted feedback, one record per assessment",
    view: "View feedbacks",
    allSubmissions:
      "All submitted website feedback, across registered and anonymous participants",
    average: "Average Satisfaction",
    averageDetail: "Overall participant satisfaction (Q5 mean)",
    technical: "Technical Issues Reported",
    technicalDetail:
      "Participants reporting technical problems while using the website.",
    responseRate: "Response Rate",
    responseRateDetail:
      "{count} feedback submissions / {total} consented, completed website assessments",
    analysis: "Feedback Ratings Analysis",
    analysisDetail:
      "Distribution of participant ratings across the five usability evaluation questions.",
    scale: [
      "Strongly Disagree",
      "Disagree",
      "Neutral",
      "Agree",
      "Strongly Agree",
    ],
    question: "Question {number}",
    dimensions: [
      "Website Navigation",
      "Scenario Clarity",
      "Assessment Interaction",
      "Interface Readability",
      "Overall Satisfaction",
    ],
    responses: "{count} valid responses",
    summary: "Usability Evaluation Summary",
    summaryDetail:
      "Mean rating comparison across evaluation dimensions (scale 1 to 5).",
    noIssues: "No issues",
    encounteredIssues: "Encountered issues",
    respondents: "valid responses",
    commentsTitle: "Participant Comments & Suggestions",
    commentsDetail:
      "Written feedback submitted by participants to help identify usability issues and opportunities for improvement.",
    participantId: "Participant ID",
    date: "Date",
    overallRating: "Overall Rating",
    technicalIssue: "Technical Issue",
    comment: "Comment / Suggestion",
    yes: "Yes",
    no: "No",
    latestComments: "Showing the latest {shown} of {total} written comments",
    noComments: "No written comments have been submitted.",
    emptyTitle: "No feedback submissions yet",
    emptyText:
      "Feedback analytics will appear when participants submit the optional survey after completing their assessment.",
    noValidResponses: "No valid responses for this question.",
    errorTitle: "Feedback could not be loaded",
    errorText:
      "The feedback data is temporarily unavailable. Refresh the page to try again.",
    countError: "Feedback count unavailable",
    unavailable: "Not available",
    methodology:
      "Each feedback submission counts once. Each rating percentage uses that question’s valid answers (1–5); technical percentages use valid Yes/No answers. Means are scores out of 5. Displayed values are rounded to one decimal; percentages may not total exactly 100%.",
  },
  ar: {
    nav: "الملاحظات",
    title: "ملاحظات سهولة الاستخدام",
    intro:
      "ملاحظات المشاركين ومؤشرات تقييم سهولة الاستخدام بعد إكمال تقييم الوعي بالأمن السيبراني.",
    received: "الملاحظات المستلمة",
    submissions: "جميع الملاحظات المرسلة، سجل واحد لكل تقييم",
    view: "عرض الملاحظات",
    allSubmissions:
      "جميع الملاحظات المرسلة عبر الموقع من المشاركين المسجلين والمجهولين",
    average: "متوسط الرضا",
    averageDetail: "الرضا العام للمشاركين (متوسط السؤال الخامس)",
    technical: "المشكلات التقنية المبلّغ عنها",
    technicalDetail:
      "المشاركون الذين أبلغوا عن مشكلات تقنية أثناء استخدام الموقع.",
    responseRate: "معدل الاستجابة",
    responseRateDetail:
      "{count} ملاحظة مرسلة / {total} تقييم مكتمل عبر الموقع بموافقة المشارك",
    analysis: "تحليل تقييمات الملاحظات",
    analysisDetail:
      "توزيع إجابات المشاركين على أسئلة تقييم سهولة الاستخدام الخمسة.",
    scale: ["أعارض بشدة", "أعارض", "محايد", "أوافق", "أوافق بشدة"],
    question: "السؤال {number}",
    dimensions: [
      "التنقل في الموقع",
      "وضوح السيناريوهات",
      "التفاعل مع التقييم",
      "سهولة قراءة الواجهة",
      "الرضا العام",
    ],
    responses: "{count} إجابة صالحة",
    summary: "ملخص تقييم سهولة الاستخدام",
    summaryDetail: "مقارنة متوسط التقييم بين جوانب الاستخدام (من 1 إلى 5).",
    noIssues: "لم يواجهوا مشكلات",
    encounteredIssues: "واجهوا مشكلات",
    respondents: "إجابة صالحة",
    commentsTitle: "ملاحظات المشاركين واقتراحاتهم",
    commentsDetail:
      "ملاحظات مكتوبة من المشاركين لتحديد مشكلات سهولة الاستخدام وفرص التحسين.",
    participantId: "معرّف المشارك",
    date: "التاريخ",
    overallRating: "التقييم العام",
    technicalIssue: "مشكلة تقنية",
    comment: "الملاحظة / الاقتراح",
    yes: "نعم",
    no: "لا",
    latestComments: "عرض أحدث {shown} من أصل {total} ملاحظة مكتوبة",
    noComments: "لم تُرسل ملاحظات مكتوبة بعد.",
    emptyTitle: "لا توجد ملاحظات مرسلة بعد",
    emptyText:
      "ستظهر التحليلات عندما يرسل المشاركون الاستبيان الاختياري بعد إكمال تقييمهم.",
    noValidResponses: "لا توجد إجابات صالحة لهذا السؤال.",
    errorTitle: "تعذر تحميل الملاحظات",
    errorText:
      "بيانات الملاحظات غير متاحة مؤقتًا. حدّث الصفحة للمحاولة مرة أخرى.",
    countError: "عدد الملاحظات غير متاح",
    unavailable: "غير متاح",
    methodology:
      "تُحتسب كل ملاحظة مرسلة مرة واحدة. تعتمد نسبة كل تقييم على الإجابات الصالحة لذلك السؤال (1–5)، ونسب المشكلات التقنية على إجابات نعم/لا الصالحة. المتوسطات درجات من 5. تُقرّب القيم المعروضة إلى منزلة عشرية واحدة؛ وقد لا يساوي مجموع النسب 100٪ تمامًا.",
  },
} as const;

export function getFeedbackCopy(locale: Locale) {
  return copy[locale];
}
