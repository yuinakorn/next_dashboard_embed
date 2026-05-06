import { notFound } from "next/navigation";
import { PageHeader, buttonStyles } from "@/components/dashboard-ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboard } from "@/lib/db/dashboards";
import { getEmbedStatusTone } from "@/lib/embed-policy";
import { canUpdateDashboard, canViewDashboard } from "@/lib/permissions";

type DashboardViewerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DashboardViewerPage({ params }: DashboardViewerPageProps) {
  const currentUser = await getCurrentUser();
  const { id } = await params;
  const dashboard = await getDashboard(id, currentUser.id);

  if (!dashboard || !canViewDashboard(currentUser, dashboard)) {
    notFound();
  }

  const needsFallback =
    dashboard.embedStatus === "external_only" || dashboard.embedStatus === "blocked";
  const actions = [
    { href: "/catalog", label: "Catalog" },
    ...(canUpdateDashboard(currentUser, dashboard)
      ? [{ href: `/dashboards/${dashboard.id}/edit`, label: "แก้ไข" }]
      : []),
    { href: "/", label: "หน้าหลัก", primary: true },
  ];

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow={`ตัวอย่าง Embed จาก ${dashboard.provider}`}
        title={dashboard.title}
        description={dashboard.categoryName}
        actions={actions}
      />

      <div className="mx-auto max-w-7xl space-y-4 px-5 py-5">
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <p className="text-sm leading-6 text-slate-600">{dashboard.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {dashboard.status}
              </span>
              <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800">
                {dashboard.sensitivity}
              </span>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-semibold ${getEmbedStatusTone(dashboard.embedStatus)}`}
              >
                {dashboard.embedStatus}
              </span>
              {dashboard.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <dl className="grid gap-3 rounded-lg bg-slate-100 p-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</dt>
              <dd className="mt-1 font-semibold text-slate-900">{dashboard.owner}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
              <dd className="mt-1 font-semibold text-slate-900">{dashboard.updatedAt}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Views</dt>
              <dd className="mt-1 font-semibold text-slate-900">{dashboard.views.toLocaleString()}</dd>
            </div>
          </dl>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Dashboard แบบ Embed</h2>
              <p className="mt-1 text-sm text-slate-500">{dashboard.embedStatusReason}</p>
            </div>
            <a
              href={dashboard.externalUrl}
              className={`${buttonStyles.secondary} h-9 w-fit px-3`}
              target="_blank"
              rel="noreferrer"
            >
              External fallback
            </a>
          </div>
          {needsFallback ? (
            <div className="flex h-[48vh] flex-col items-center justify-center px-5 text-center">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
                <p className="max-w-xl text-sm leading-6 text-rose-900">
                  Dashboard นี้ถูกระบุเป็น external-only เพราะ Provider อาจบล็อก iframe ด้วย
                  X-Frame-Options, CSP frame-ancestors, Cloudflare หรือกติกาการยืนยันตัวตน
                </p>
                <a
                  href={dashboard.externalUrl}
                  className={`${buttonStyles.primary} mt-4 h-10`}
                  target="_blank"
                  rel="noreferrer"
                >
                  เปิด Dashboard ภายนอก
                </a>
              </div>
            </div>
          ) : (
            <iframe
              title={dashboard.title}
              src={dashboard.embedUrl}
              className="h-[72vh] w-full bg-slate-50"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
            />
          )}
        </section>
      </div>
    </main>
  );
}
