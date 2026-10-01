import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import {
  AdminFilters,
  AdminPagination,
  RiskBadge,
} from "@/components/admin-records";
import { getAdminCopy } from "@/src/admin/copy";
import { formatAdminDate } from "@/src/admin/format";
import { pageCount, parseAdminListQuery } from "@/src/admin/query";
import { listParticipants } from "@/src/admin/service";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export default async function ParticipantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const query = parseAdminListQuery(await searchParams);
  const data = await listParticipants(actor, query);
  const pages = pageCount(data.total);
  if (query.page > pages) redirect(`/${locale}/admin/participants`);
  const t = getAdminCopy(locale);
  return (
    <AdminShell
      actorName={actor.displayName}
      intro={t.participantsIntro}
      locale={locale}
      title={t.participantsTitle}
    >
      <section className="panel admin-list-panel">
        <AdminFilters locale={locale} query={query} />
        {data.rows.length === 0 ? (
          <p className="admin-empty">{t.noRecords}</p>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.participant}</th>
                  <th>{t.participantId}</th>
                  <th>{t.accountType}</th>
                  <th>{t.username}</th>
                  <th>{t.latestScore}</th>
                  <th>{t.risk}</th>
                  <th>{t.latestSubmission}</th>
                  <th>{t.status}</th>
                  <th>
                    <span className="sr-only">{t.viewDetails}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.displayName}</strong>
                    </td>
                    <td>
                      <bdi dir="ltr">{row.publicCode}</bdi>
                    </td>
                    <td>{t[row.type]}</td>
                    <td>{row.username ?? "—"}</td>
                    <td>{row.latestScore ?? "—"}</td>
                    <td>
                      <RiskBadge locale={locale} risk={row.latestRisk} />
                    </td>
                    <td>{formatAdminDate(row.latestCompletedAt, locale)}</td>
                    <td>
                      <span
                        className={`admin-status admin-status--${row.hasCompleted ? "completed" : "in_progress"}`}
                      >
                        {row.hasCompleted ? t.completed : t.incomplete}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="table-link"
                        href={`/${locale}/admin/participants/${row.id}`}
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
        <AdminPagination
          locale={locale}
          pathname={`/${locale}/admin/participants`}
          query={query}
          total={data.total}
        />
      </section>
    </AdminShell>
  );
}
