import Link from "next/link";

import { AdminShell } from "@/components/admin-shell";
import { DonutChart } from "@/components/donut-chart";
import { Icon, type IconName } from "@/components/icon";
import { getFeedbackCopy } from "@/src/admin/feedback-copy";
import type { FeedbackAnalytics } from "@/src/admin/feedback-analytics";
import { formatAdminDate } from "@/src/admin/format";
import { getDictionary, type Locale } from "@/src/i18n";
import styles from "./admin-feedback.module.css";

const ratingColors = ["#e11d48", "#fb923c", "#cbd5e1", "#2dd4bf", "#0f766e"];
const decimal = (value: number | null) =>
  value === null ? "—" : value.toFixed(1);

export function FeedbackCountCard({
  locale,
  count,
}: {
  locale: Locale;
  count: number | null;
}) {
  const t = getFeedbackCopy(locale);
  return (
    <article
      className={`panel metric-card ${styles.countCard}`}
      data-feedback-count
    >
      <div className="metric-card-heading">
        <p>{t.received}</p>
        <span className="metric-card-icon">
          <Icon name="feedback" size={19} />
        </span>
      </div>
      {count === null ? (
        <p className={styles.countError} role="status">
          {t.countError}
        </p>
      ) : (
        <strong>{count}</strong>
      )}
      <Link href={`/${locale}/admin/feedbacks`} className={styles.countLink}>
        {t.view}
        <Icon name="arrow" size={14} />
      </Link>
      <span className="sr-only">{t.allSubmissions}</span>
    </article>
  );
}

export function AdminFeedbackView({
  actorName,
  locale,
  data,
}: {
  actorName: string;
  locale: Locale;
  data: FeedbackAnalytics | null;
}) {
  const t = getFeedbackCopy(locale);
  return (
    <AdminShell
      actorName={actorName}
      title={t.title}
      intro={t.intro}
      locale={locale}
    >
      <FeedbackAnalyticsContent locale={locale} data={data} />
    </AdminShell>
  );
}

export function FeedbackAnalyticsContent({
  locale,
  data,
}: {
  locale: Locale;
  data: FeedbackAnalytics | null;
}) {
  const t = getFeedbackCopy(locale);
  const survey = getDictionary(locale).feedback;
  if (!data)
    return (
      <section className={styles.state} role="alert">
        <Icon name="alert" />
        <h2>{t.errorTitle}</h2>
        <p>{t.errorText}</p>
      </section>
    );
  if (data.total === 0)
    return (
      <section className={styles.state}>
        <Icon name="feedback" />
        <h2>{t.emptyTitle}</h2>
        <p>{t.emptyText}</p>
      </section>
    );

  const satisfaction = data.questions.find(
    (question) => question.question === "satisfactionRating",
  )!;
  const responses = (count: number) =>
    t.responses.replace("{count}", String(count));
  const metrics: Array<{
    title: string;
    value: string | number;
    detail: string;
    icon: IconName;
    warning?: boolean;
  }> = [
    {
      title: t.received,
      value: data.total,
      detail: t.submissions,
      icon: "feedback",
    },
    {
      title: t.average,
      value: `${decimal(satisfaction.mean)} / 5`,
      detail: `${t.averageDetail} · ${responses(satisfaction.validCount)}`,
      icon: "star",
    },
    {
      title: t.technical,
      value: `${data.technical.yes.count} (${decimal(data.technical.yes.percentage)}%)`,
      detail: responses(data.technical.validCount),
      icon: "alert",
      warning: true,
    },
    {
      title: t.responseRate,
      value:
        data.responseRate === null ? "—" : `${decimal(data.responseRate)}%`,
      detail: t.responseRateDetail
        .replace("{count}", String(data.total))
        .replace("{total}", String(data.completedAssessments)),
      icon: "chart",
    },
  ];
  return (
    <div className={styles.content}>
      <section className={styles.metrics} aria-label={t.title}>
        {metrics.map((metric) => (
          <article
            className={`${styles.panel} ${styles.metric} ${metric.warning ? styles.warning : ""}`}
            key={metric.title}
          >
            <div>
              <h2>{metric.title}</h2>
              <span className={styles.metricIcon}>
                <Icon name={metric.icon} size={17} />
              </span>
            </div>
            <strong>
              <bdi>{metric.value}</bdi>
            </strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>
      <section
        className={`${styles.panel} ${styles.analysis}`}
        aria-labelledby="feedback-ratings-title"
      >
        <header className={styles.analysisHeader}>
          <div>
            <h2 id="feedback-ratings-title">{t.analysis}</h2>
            <p>{t.analysisDetail}</p>
          </div>
          <ul className={styles.legend} aria-label={t.analysis}>
            {t.scale.map((label, index) => (
              <li key={label}>
                <span style={{ backgroundColor: ratingColors[index] }} />
                {index + 1}: {label}
              </li>
            ))}
          </ul>
        </header>
        {data.questions.map((question, index) => (
          <article
            className={styles.question}
            key={question.question}
            aria-labelledby={`feedback-question-${index}`}
          >
            <div className={styles.questionHeader}>
              <div>
                <h3 id={`feedback-question-${index}`}>
                  {t.question.replace("{number}", String(index + 1))} —{" "}
                  {t.dimensions[index]}
                </h3>
                <p>{survey.questions[index].replace(/^\d+\.\s*/, "")}</p>
              </div>
              <div className={styles.questionStats}>
                <strong>
                  <bdi>{decimal(question.mean)} / 5</bdi>
                </strong>
                <span>{responses(question.validCount)}</span>
              </div>
            </div>
            {question.validCount === 0 ? (
              <p className={styles.noResponses}>{t.noValidResponses}</p>
            ) : (
              <>
                <div className={styles.stackedBar} aria-hidden="true">
                  {question.distribution.map((item) => (
                    <span
                      key={item.rating}
                      style={{
                        width: `${item.percentage ?? 0}%`,
                        backgroundColor: ratingColors[item.rating - 1],
                      }}
                    />
                  ))}
                </div>
                <ul
                  className={styles.breakdown}
                  aria-label={responses(question.validCount)}
                >
                  {question.distribution.map((item) => (
                    <li key={item.rating}>
                      <span className="sr-only">
                        {t.scale[item.rating - 1]}:{" "}
                      </span>
                      <bdi>
                        [{item.rating}] {decimal(item.percentage)}% (
                        {item.count})
                      </bdi>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>
        ))}
        <p className={styles.methodology}>{t.methodology}</p>
      </section>
      <section className={styles.deepDive}>
        <div className={`${styles.panel} ${styles.summary}`}>
          <h2>{t.summary}</h2>
          <p>{t.summaryDetail}</p>
          {data.questions.map((question, index) => (
            <div className={styles.meanRow} key={question.question}>
              <div>
                <span>{t.dimensions[index]}</span>
                <strong>
                  <bdi>{decimal(question.mean)} / 5</bdi>
                </strong>
              </div>
              {question.mean === null ? (
                <p>{t.noValidResponses}</p>
              ) : (
                <div className={styles.meanTrack} aria-hidden="true">
                  <span style={{ width: `${(question.mean / 5) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={styles.technical}>
          <DonutChart
            chartId="feedback-technical"
            title={t.technical}
            description={t.technicalDetail}
            centerLabel={t.respondents}
            centerValue={data.technical.validCount}
            emptyLabel={t.noValidResponses}
            items={[
              {
                id: "no",
                label: t.noIssues,
                count: data.technical.no.count,
                percentage: data.technical.no.percentage ?? 0,
                color: "#0d9488",
              },
              {
                id: "yes",
                label: t.encounteredIssues,
                count: data.technical.yes.count,
                percentage: data.technical.yes.percentage ?? 0,
                color: "#f59e0b",
              },
            ]}
          />
        </div>
      </section>
      <section
        className={`${styles.panel} ${styles.comments}`}
        aria-labelledby="feedback-comments-title"
      >
        <header>
          <h2 id="feedback-comments-title">{t.commentsTitle}</h2>
          <p>{t.commentsDetail}</p>
        </header>
        {data.comments.length === 0 ? (
          <p className={styles.noComments}>{t.noComments}</p>
        ) : (
          <>
            <div
              className={styles.tableScroll}
              tabIndex={0}
              role="region"
              aria-label={t.commentsTitle}
            >
              <table>
                <thead>
                  <tr>
                    <th>{t.participantId}</th>
                    <th>{t.date}</th>
                    <th>{t.overallRating}</th>
                    <th>{t.technicalIssue}</th>
                    <th>{t.comment}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.comments.map((comment) => (
                    <tr key={comment.id}>
                      <td>
                        <strong>
                          <bdi dir="ltr">
                            {comment.publicCode ?? t.unavailable}
                          </bdi>
                        </strong>
                      </td>
                      <td>{formatAdminDate(comment.submittedAt, locale)}</td>
                      <td>
                        <bdi>
                          {comment.satisfactionRating >= 1 &&
                          comment.satisfactionRating <= 5
                            ? `${comment.satisfactionRating} / 5`
                            : "—"}
                        </bdi>
                      </td>
                      <td>
                        <span
                          className={
                            comment.technicalProblem ? styles.yes : styles.no
                          }
                        >
                          {comment.technicalProblem ? t.yes : t.no}
                        </span>
                      </td>
                      <td className={styles.commentText}>
                        <p dir="auto">{comment.comments}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer>
              {t.latestComments
                .replace("{shown}", String(data.comments.length))
                .replace("{total}", String(data.writtenComments))}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
