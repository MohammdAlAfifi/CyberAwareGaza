# Phase 8 historical import and research export

## Historical CSV contract

The importer accepts a UTF-8 CSV (optional BOM) and uses a standards-compliant
CSV parser, so quoted commas, quoted newlines, Arabic text, and Windows line
endings are supported. Files are limited to 5 MiB and 5,000 response records.

The importer identifies one timestamp column named `طابع زمني` or `Timestamp`,
one consent column whose header contains the English or Arabic consent term,
and the eight scenario columns by similarity to the exact approved questions in
`src/assessment/content.ts`. A missing, ambiguous, or repeated mapping blocks
the preview.

Consent is exact after Unicode and surrounding-whitespace normalization:

- accepted: `Yes, I agree. / نعم، أوافق.`
- rejected: `No, I do not agree. / لا، لا أوافق.`

Empty and unknown consent values are invalid and never imply agreement.
Declined rows retain only the source record number and exclusion reason. Their
timestamps and questionnaire answers are not written to the database.

For S1-S3 and S5-S8, an answer may be the exact approved English text, Arabic
text, or both separated by `|`. S4 is matched to its exact password string.
Matching uses content, never CSV order or questionnaire letters, and produces
stable option IDs. The single implementation is
`src/import/historical-csv.ts`; it is validated against the same catalogue used
by website assessments. Authoritative scoring then calls
`calculateAssessmentScore`, the Phase 5 backend scorer.

## Timestamp and duplicate policy

ISO timestamps and unambiguous Google Forms numeric timestamps are interpreted
in `Asia/Hebron` and stored in `source_submitted_at`. Ambiguous day/month values
are flagged and left null instead of guessed. The batch timestamp remains the
actual import time.

The SHA-256 file fingerprint detects byte-identical reuploads. For overlapping
or reordered files, a source-response key hashes the normalized original
timestamp plus all eight mapped stable option IDs. Answers alone never identify
a duplicate, so identical answer sets at different timestamps remain distinct.
Rows without a timestamp cannot be reliably matched across different files;
the preview warns about the missing timestamp and the exact-file fingerprint is
the available duplicate safeguard.

Confirmation reuploads and reparses the same file, verifies its fingerprint,
locks the fingerprint transactionally, and rechecks source-response keys. A
committed-fingerprint unique index and unique source keys protect concurrent
requests. Participants, consent, completed attempts, eight responses, import
row links, counters, and the batch report are written in one transaction.

Imported respondents use participant type `imported`, source `google_form`, no
account/session/result token, and the shared concurrency-safe anonymous ordinal
counter. Their display label is `Anonymous X` (or `مجهول X` in Arabic exports).

## Export eligibility

Every export endpoint requires an active administrator session. Completed
assessment and response exports require an affirmative consent linked to the
same participant, attempt, and source. Source, risk, and date filters are
applied in the database to the full matching dataset.

- Participants CSV includes participants from the selected source. Its attempt
  count and latest-result fields use only consented completed attempts matching
  all selected attempt filters. A risk/date filter excludes participants with
  no matching attempt; without those filters, eligible participants without an
  attempt remain present with blank latest-result fields.
- Assessments CSV includes one row per matching completed attempt and all eight
  selected answers/deltas. Attempts are never combined.
- Risk Distribution and Scenario Analytics CSV use the same active
  content/rubric eligibility rule as Phase 7.
- Excel and PDF are participant-response reports with one distinct section or
  row per matching completed attempt.

CSV files use a UTF-8 BOM, RFC-style quoting, CRLF records, and apostrophe
protection for spreadsheet formula prefixes. Excel answer cells are explicit
text values. No credential, password hash, session token, or raw import file is
exported or logged.

## Historical source file

The verified research CSV was not present in the repository during
implementation. Place `Cybersecurity Awareness Scenario Questionnaire .csv`
under `reference/research/` for operator reference, or select it directly from
the administrator's computer on the Import / Export page. Do not add it as an
automated test fixture or seed. The administrator must review the preview and
select **Confirm import** before any research records are created.
