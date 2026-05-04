import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/db/dashboards";
import { getEmbedStatusTone } from "@/lib/embed-policy";
import { mockCurrentUser } from "@/lib/mock-portal-data";
import { canViewDashboard } from "@/lib/permissions";

type DashboardViewerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DashboardViewerPage({ params }: DashboardViewerPageProps) {
  const { id } = await params;
  const dashboard = await getDashboard(id, mockCurrentUser.id);

  if (!dashboard || !canViewDashboard(mockCurrentUser, dashboard)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500">
              {dashboard.provider} embed preview
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold">{dashboard.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{dashboard.categoryName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/catalog"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Catalog
            </Link>
            <a
              href={dashboard.externalUrl}
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              target="_blank"
              rel="noreferrer"
            >
              Open fallback
            </a>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-4 px-5 py-5">
        <section className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm leading-6 text-zinc-600">{dashboard.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                {dashboard.status}
              </span>
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                {dashboard.sensitivity}
              </span>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-medium ${getEmbedStatusTone(dashboard.embedStatus)}`}
              >
                {dashboard.embedStatus}
              </span>
              {dashboard.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm text-zinc-500 lg:text-right">
            <div>{dashboard.owner}</div>
            <div className="mt-1">Updated {dashboard.updatedAt}</div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Embedded dashboard</h2>
              <p className="mt-1 text-sm text-zinc-500">{dashboard.embedStatusReason}</p>
            </div>
            <a
              href={dashboard.externalUrl}
              className="inline-flex h-9 w-fit items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              target="_blank"
              rel="noreferrer"
            >
              External fallback
            </a>
          </div>
          {dashboard.embedStatus === "external_only" || dashboard.embedStatus === "blocked" ? (
            <div className="flex h-[48vh] flex-col items-center justify-center px-5 text-center">
              <p className="max-w-xl text-sm leading-6 text-zinc-600">
                This dashboard is marked as external-only. The provider may block iframe using
                X-Frame-Options, CSP frame-ancestors, Cloudflare, or authentication rules.
              </p>
              <a
                href={dashboard.externalUrl}
                className="mt-4 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                target="_blank"
                rel="noreferrer"
              >
                Open external dashboard
              </a>
            </div>
          ) : (
            <iframe
              title={dashboard.title}
              src={dashboard.embedUrl}
              className="h-[72vh] w-full bg-white"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
            />
          )}
        </section>
      </div>
    </main>
  );
}
