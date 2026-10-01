import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { getAdminCopy } from "@/src/admin/copy";
import { formatAdminDate } from "@/src/admin/format";
import { listImportAudits } from "@/src/admin/service";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export default async function ImportExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const t = getAdminCopy(locale);
  const audits = await listImportAudits(actor);
  return (
    <AdminShell
      actorName={actor.displayName}
      intro={t.importText}
      locale={locale}
      title={t.importTitle}
    >
      <section className="panel admin-list-panel">
        <h2>{t.importAudit}</h2>
        {audits.length === 0 ? (
          <p className="admin-empty">{t.noImports}</p>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.filename}</th>
                  <th>{t.importState}</th>
                  <th>{t.rows}</th>
                  <th>{t.accepted}</th>
                  <th>{t.rejected}</th>
                  <th>{t.duplicates}</th>
                  <th>{t.created}</th>
                  <th>{t.committedAt}</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <bdi dir="ltr">{row.filename}</bdi>
                    </td>
                    <td>{row.state}</td>
                    <td>{row.totalRows}</td>
                    <td>{row.acceptedRows}</td>
                    <td>{row.excludedRows}</td>
                    <td>{row.duplicateRows}</td>
                    <td>{formatAdminDate(row.createdAt, locale)}</td>
                    <td>{formatAdminDate(row.committedAt, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
