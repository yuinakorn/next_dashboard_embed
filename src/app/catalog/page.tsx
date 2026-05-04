import Link from "next/link";
import { getEmbedStatusTone } from "@/lib/embed-policy";
import { mockCurrentUser, mockDashboards, visibleDashboards } from "@/lib/mock-portal-data";
import {
  canPublishDashboard,
  canUpdateDashboard,
  getUserPermissions,
} from "@/lib/permissions";
import type { Dashboard, DashboardStatus, SensitivityLevel } from "@/lib/portal-types";

const statusTone: Record<DashboardStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  in_review: "bg-amber-50 text-amber-800",
  published: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
  archived: "bg-zinc-200 text-zinc-600",
};

const sensitivityTone: Record<SensitivityLevel, string> = {
  public: "bg-teal-50 text-teal-800",
  internal: "bg-sky-50 text-sky-800",
  confidential: "bg-orange-50 text-orange-800",
  restricted: "bg-rose-50 text-rose-800",
};

function CatalogRow({ dashboard }: { dashboard: Dashboard }) {
  const canUpdate = canUpdateDashboard(mockCurrentUser, dashboard);
  const canPublish = canPublishDashboard(mockCurrentUser, dashboard);

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="min-w-72 px-4 py-4 align-top">
        <div className="font-medium text-zinc-950">{dashboard.title}</div>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500">{dashboard.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {dashboard.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-4 align-top text-sm text-zinc-600">
        <div className="font-medium text-zinc-800">{dashboard.provider}</div>
        <div className="mt-1">{dashboard.categoryName}</div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex flex-col gap-2">
          <span className={`w-fit rounded-md px-2 py-1 text-xs font-medium ${statusTone[dashboard.status]}`}>
            {dashboard.status}
          </span>
          <span
            className={`w-fit rounded-md px-2 py-1 text-xs font-medium ${sensitivityTone[dashboard.sensitivity]}`}
          >
            {dashboard.sensitivity}
          </span>
          <span
            className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${getEmbedStatusTone(dashboard.embedStatus)}`}
          >
            {dashboard.embedStatus}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 align-top text-sm text-zinc-600">
        <div className="font-medium text-zinc-800">{dashboard.owner}</div>
        <div className="mt-1">{dashboard.updatedAt}</div>
      </td>
      <td className="px-4 py-4 align-top text-right">
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboards/${dashboard.id}`}
            className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Open
          </Link>
          <button
            className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canUpdate}
          >
            Edit
          </button>
          <button
            className="inline-flex h-9 items-center rounded-md bg-zinc-950 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canPublish}
          >
            Publish
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CatalogPage() {
  const permissions = getUserPermissions(mockCurrentUser);
  const reviewCount = mockDashboards.filter(
    (dashboard) => dashboard.status === "in_review" && dashboard.ownerTeamId === mockCurrentUser.teamId,
  ).length;

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Internal Portal</p>
            <h1 className="mt-1 text-2xl font-semibold">Dashboard Catalog</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Home
            </Link>
            <Link
              href="/review"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Review queue
            </Link>
            <Link
              href="/dashboards/new"
              className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            >
              New dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Visible dashboards</p>
            <strong className="mt-2 block text-3xl font-semibold">{visibleDashboards.length}</strong>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Team review queue</p>
            <strong className="mt-2 block text-3xl font-semibold">{reviewCount}</strong>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Current permissions</p>
            <strong className="mt-2 block text-3xl font-semibold">{permissions.length}</strong>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_140px]">
            <input
              className="h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500"
              placeholder="Search title, owner, tag, category..."
            />
            <select className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">
              <option>All statuses</option>
              <option>Published</option>
              <option>In review</option>
              <option>Draft</option>
            </select>
            <select className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">
              <option>All sensitivity</option>
              <option>Public</option>
              <option>Internal</option>
              <option>Confidential</option>
            </select>
            <button className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800">
              Filter
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-4">
            <h2 className="text-lg font-semibold">Catalog Items</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Action buttons are enabled or disabled by the current mock SSO permissions.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Dashboard</th>
                  <th className="px-4 py-3 font-semibold">Provider / Category</th>
                  <th className="px-4 py-3 font-semibold">Governance</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDashboards.map((dashboard) => (
                  <CatalogRow key={dashboard.id} dashboard={dashboard} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
