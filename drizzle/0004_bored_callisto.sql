CREATE TABLE "assessment_draft_answers" (
	"attempt_id" uuid NOT NULL,
	"content_version_id" varchar(64) NOT NULL,
	"scenario_key" varchar(2) NOT NULL,
	"selected_option_id" varchar(48) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_draft_answers_attempt_id_scenario_key_pk" PRIMARY KEY("attempt_id","scenario_key"),
	CONSTRAINT "draft_answers_scenario_key_check" CHECK ("assessment_draft_answers"."scenario_key" in ('S1','S2','S3','S4','S5','S6','S7','S8'))
);
--> statement-breakpoint
ALTER TABLE "assessment_draft_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assessment_draft_answers" ADD CONSTRAINT "draft_answers_attempt_content_fk" FOREIGN KEY ("attempt_id","content_version_id") REFERENCES "public"."assessment_attempts"("id","content_version_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_draft_answers" ADD CONSTRAINT "draft_answers_selected_option_fk" FOREIGN KEY ("content_version_id","scenario_key","selected_option_id") REFERENCES "public"."options"("content_version_id","scenario_key","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_one_web_in_progress_idx" ON "assessment_attempts" USING btree ("participant_id") WHERE "assessment_attempts"."source" = 'web' and "assessment_attempts"."status" = 'in_progress';--> statement-breakpoint
UPDATE "content_versions" SET "is_active" = false WHERE "is_active" = true;--> statement-breakpoint
INSERT INTO "content_versions" ("id", "label", "is_active", "approved_at") VALUES
('pdf-section-7-v1', 'Stitch Design Specification section 7', true, now());--> statement-breakpoint
INSERT INTO "scenarios" ("content_version_id", "key", "display_order", "question_en", "question_ar") VALUES
('pdf-section-7-v1', 'S1', 1, $cag$You received an email that looks like it came from the university Moodle system. It says:
“Your account will be suspended within 2 hours unless you verify your login now.”
The email includes a “Verify Account” button.

What would you do?$cag$, $cag$استلمت رسالة بريد إلكتروني تبدو وكأنها صادرة من نظام مودل الخاص بالجامعة، وتقول:
«سيتم إيقاف حسابك خلال ساعتين ما لم تقم بتأكيد تسجيل الدخول الآن.»
وتحتوي الرسالة على زر “تأكيد الحساب”.

ماذا ستفعل؟$cag$),
('pdf-section-7-v1', 'S2', 2, $cag$A WhatsApp message in a class group says:
“New lecture notes uploaded. Download quickly before it gets deleted!”
It includes a shortened link.

What would you do?$cag$, $cag$تصل رسالة في مجموعة الصف على واتساب تقول:
«تم رفع ملاحظات جديدة للمحاضرة. حمّلها بسرعة قبل أن يتم حذفها!»
وتحتوي الرسالة على رابط مختصر.

ماذا ستفعل؟$cag$),
('pdf-section-7-v1', 'S3', 3, $cag$You received an email that appears to be from your instructor asking you to confirm your student ID and reset your password using an attached file.

What would you do?$cag$, $cag$استلمت رسالة بريد إلكتروني تبدو وكأنها من مدرسك، وتطلب منك تأكيد رقمك الجامعي وإعادة تعيين كلمة المرور باستخدام ملف مرفق.

ماذا ستفعل؟$cag$),
('pdf-section-7-v1', 'S4', 4, $cag$Which of the following passwords do you consider the strongest for a university account?$cag$, $cag$أي من كلمات المرور التالية تعتقد أنها الأقوى لاستخدامها في حساب جامعي؟$cag$),
('pdf-section-7-v1', 'S5', 5, $cag$You get an email:
“Your grades have been updated. Click here to view your grades .”
The email includes a “View Results” button and asks you to sign in after clicking it.

What would you do?$cag$, $cag$تستلم رسالة بريد إلكتروني تقول:
«تم تحديث درجاتك. اضغط هنا لعرض درجتك.»
تحتوي الرسالة على زر “عرض النتيجة” وتطلب منك تسجيل الدخول بعد الضغط عليه.

ماذا ستفعل؟$cag$),
('pdf-section-7-v1', 'S6', 6, $cag$An email says:
“Please review the attached invoice.”
The attachment name is:
Invoice.pdf.exe

What would you do?$cag$, $cag$تصل رسالة بريد إلكتروني تقول:
«يرجى مراجعة الفاتورة المرفقة.»
واسم الملف المرفق هو:
Invoice.pdf.exe

ماذا ستفعل؟$cag$),
('pdf-section-7-v1', 'S7', 7, $cag$On campus, you connect to a Wi-Fi network and a page opens asking you to login with your university credentials, but the page design looks slightly different.

What would you do?$cag$, $cag$أثناء وجودك في الجامعة، تتصل بشبكة الواي فاي وتظهر صفحة تطلب منك تسجيل الدخول باستخدام بيانات حسابك الجامعي، لكن تصميم الصفحة يبدو مختلفًا قليلًا عن المعتاد.

ماذا ستفعل؟$cag$),
('pdf-section-7-v1', 'S8', 8, $cag$You receive a message:
“We are verifying your account. Reply with the code you just received.”
You indeed received a verification code on your phone.

What would you do?$cag$, $cag$تستلم رسالة تقول:
«نقوم بالتحقق من حسابك. أرسل لنا رمز التحقق الذي وصل إليك للتو.»
وبالفعل، وصل إلى هاتفك رمز تحقق.

ماذا ستفعل؟$cag$);--> statement-breakpoint
INSERT INTO "options" ("content_version_id", "scenario_key", "id", "display_order", "text_en", "text_ar") VALUES
('pdf-section-7-v1', 'S1', 'S1O1', 1, $cag$Click the button and login immediately.$cag$, $cag$الضغط على الزر وتسجيل الدخول فورًا.$cag$),
('pdf-section-7-v1', 'S1', 'S1O2', 2, $cag$Open the official Moodle website manually and check notifications.$cag$, $cag$فتح موقع مودل الرسمي يدويًا والتحقق من الإشعارات.$cag$),
('pdf-section-7-v1', 'S1', 'S1O3', 3, $cag$Ignore without reporting.$cag$, $cag$تجاهل الرسالة دون الإبلاغ عنها.$cag$),
('pdf-section-7-v1', 'S2', 'S2O1', 1, $cag$Open the shortened link immediately.$cag$, $cag$فتح الرابط المختصر فورًا.$cag$),
('pdf-section-7-v1', 'S2', 'S2O2', 2, $cag$Access resources from the official LMS directly.$cag$, $cag$الدخول إلى المصادر مباشرة من نظام إدارة التعلم الرسمي.$cag$),
('pdf-section-7-v1', 'S2', 'S2O3', 3, $cag$Ask sender for official LMS link.$cag$, $cag$طلب الرابط الرسمي لنظام إدارة التعلم من المرسل.$cag$),
('pdf-section-7-v1', 'S3', 'S3O1', 1, $cag$Open attachment and follow instructions quickly.$cag$, $cag$فتح الملف المرفق وتنفيذ التعليمات بسرعة.$cag$),
('pdf-section-7-v1', 'S3', 'S3O2', 2, $cag$Verify through official Moodle/department contact first.$cag$, $cag$التحقق أولًا من خلال نظام إدارة التعلم الرسمي أو التواصل المباشر مع القسم/المدرس.$cag$),
('pdf-section-7-v1', 'S3', 'S3O3', 3, $cag$Reply to the email and proceed if they reply.$cag$, $cag$الرد على البريد الإلكتروني والمتابعة إذا قام المرسل بالرد.$cag$),
('pdf-section-7-v1', 'S4', 'S4O1', 1, 'Ahmed@Gaza2026!', 'Ahmed@Gaza2026!'),
('pdf-section-7-v1', 'S4', 'S4O2', 2, 'Mohammed2026!', 'Mohammed2026!'),
('pdf-section-7-v1', 'S4', 'S4O3', 3, '123456789012', '123456789012'),
('pdf-section-7-v1', 'S4', 'S4O4', 4, 'ahmed1234567', 'ahmed1234567'),
('pdf-section-7-v1', 'S5', 'S5O1', 1, $cag$Type official website URL manually and check grades there.$cag$, $cag$كتابة عنوان الموقع الرسمي يدويًا والتحقق من الدرجات من خلاله.$cag$),
('pdf-section-7-v1', 'S5', 'S5O2', 2, $cag$Click the link because grades are important.$cag$, $cag$الضغط على الرابط لأن الدرجات مهمة.$cag$),
('pdf-section-7-v1', 'S5', 'S5O3', 3, $cag$Forward email to friends to warn them.$cag$, $cag$إعادة توجيه البريد الإلكتروني للأصدقاء لتحذيرهم.$cag$),
('pdf-section-7-v1', 'S6', 'S6O1', 1, $cag$Report to IT/security and do not open attachment.$cag$, $cag$الإبلاغ عنه إلى مسؤول تقنية المعلومات/الأمن وعدم فتح الملف المرفق.$cag$),
('pdf-section-7-v1', 'S6', 'S6O2', 2, $cag$Open the attachment to check what it is.$cag$, $cag$فتح الملف المرفق لمعرفة محتواه.$cag$),
('pdf-section-7-v1', 'S6', 'S6O3', 3, $cag$Delete the email immediately.$cag$, $cag$حذف البريد الإلكتروني فورًا.$cag$),
('pdf-section-7-v1', 'S7', 'S7O1', 1, $cag$Disconnect and ask IT/official staff for the correct Wi-Fi name/portal.$cag$, $cag$قطع الاتصال وسؤال مسؤول تقنية المعلومات أو موظف رسمي عن اسم الشبكة وصفحة الدخول الصحيحة.$cag$),
('pdf-section-7-v1', 'S7', 'S7O2', 2, $cag$Enter credentials because you need internet quickly.$cag$, $cag$إدخال بيانات تسجيل الدخول لأنك تحتاج إلى الإنترنت بسرعة.$cag$),
('pdf-section-7-v1', 'S7', 'S7O3', 3, $cag$Use mobile hotspot instead.$cag$, $cag$استخدام نقطة اتصال الهاتف بدلًا من ذلك.$cag$),
('pdf-section-7-v1', 'S8', 'S8O1', 1, $cag$Share the code to finish verification.$cag$, $cag$مشاركة الرمز لإكمال عملية التحقق.$cag$),
('pdf-section-7-v1', 'S8', 'S8O2', 2, $cag$Do not share; login to official site manually and review security settings.$cag$, $cag$عدم مشاركة الرمز، والدخول يدويًا إلى الموقع الرسمي ومراجعة إعدادات الأمان.$cag$),
('pdf-section-7-v1', 'S8', 'S8O3', 3, $cag$Ignore and change password later.$cag$, $cag$تجاهل الرسالة وتغيير كلمة المرور لاحقًا.$cag$);
