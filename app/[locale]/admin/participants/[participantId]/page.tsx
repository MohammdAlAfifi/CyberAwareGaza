import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { RiskBadge, StatusBadge } from "@/components/admin-records";
import { getAdminCopy } from "@/src/admin/copy";
import { formatAdminDate } from "@/src/admin/format";
import { getParticipantDetails } from "@/src/admin/service";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export default async function ParticipantDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; participantId: string }>;
}) {
  const { locale, participantId } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const data = await getParticipantDetails(actor, participantId);
  if (!data) notFound();
  const t = getAdminCopy(locale);
  const p = data.participant;
  return (
    <AdminShell
      actorName={actor.displayName}
      intro={`${p.displayName} · ${p.publicCode}`}
      locale={locale}
      title={t.participantDetails}
    >
      <section className="admin-detail-grid">
        <article className="panel admin-detail-card">
          <h2>{t.identity}</h2>
          <dl className="admin-facts">
            <div>
              <dt>{t.participant}</dt>
              <dd>{p.displayName}</dd>
            </div>
            <div>
              <dt>{t.participantId}</dt>
              <dd>
                <bdi dir="ltr">{p.publicCode}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t.accountType}</dt>
              <dd>{t[p.type]}</dd>
            </div>
            <div>
              <dt>{t.username}</dt>
              <dd>{p.username ?? "—"}</dd>
            </div>
            <div>
              <dt>{t.source}</dt>
              <dd>{p.source === "web" ? t.website : t.googleForm}</dd>
            </div>
            <div>
              <dt>{t.created}</dt>
              <dd>{formatAdminDate(p.createdAt, locale)}</dd>
            </div>
            <div>
              <dt>{t.updated}</dt>
              <dd>{formatAdminDate(p.updatedAt, locale)}</dd>
            </div>
            <div>
              <dt>{t.status}</dt>
              <dd>
                {data.attempts.some((a) => a.status === "completed")
                  ? t.completed
                  : t.incomplete}
              </dd>
            </div>
          </dl>
        </article>
        <article className="panel admin-detail-card">
          <h2>{t.attemptHistory}</h2>
          {data.attempts.length === 0 ? (
            <p className="admin-empty">{t.noRecords}</p>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t.source}</th>
                    <th>{t.status}</th>
                    <th>{t.rawScore}</th>
                    <th>{t.risk}</th>
                    <th>{t.started}</th>
                    <th>{t.completedAt}</th>
                    <th>
                      <span className="sr-only">{t.viewDetails}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((row) => (
                    <tr key={row.id}>
                      <td>{row.source === "web" ? t.website : t.googleForm}</td>
                      <td>
                        <StatusBadge locale={locale} status={row.status} />
                      </td>
                      <td>{row.totalScore ?? "—"}</td>
                      <td>
                        <RiskBadge locale={locale} risk={row.risk} />
                      </td>
                      <td>{formatAdminDate(row.startedAt, locale)}</td>
                      <td>{formatAdminDate(row.completedAt, locale)}</td>
                      <td>
                        <Link
                          className="table-link"
                          href={`/${locale}/admin/assessments/${row.id}`}
                        >
                          {t.viewDetails}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </AdminShell>
  );
}
