import Link from "next/link";
import { mockAuditEvents, mockCurrentUser } from "@/lib/mock-portal-data";
import { hasPermission } from "@/lib/permissions";
import type { AuditEvent } from "@/lib/portal-types";

const actionTone: Record<string, string> = {
  "dashboard.publish": "bg-emerald-50 text-emerald-800",
  "dashboard.reject": "bg-rose-50 text-rose-800",
  "dashboard.submit_review": "bg-amber-50 text-amber-800",
  "dashboard.update_embed_url": "bg-sky-50 text-sky-800",
  "category.create_child": "bg-violet-50 text-violet-800",
};

function AuditRow({ event }: { event: AuditEvent }) {
  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="min-w-52 px-4 py-4 align-top">
        <span
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            actionTone[event.action] ?? "bg-zinc-100 text-zinc-700"
          }`}
        >
          {event.action}
        </span>
        <div className="mt-2 text-sm text-zinc-500">{event.entityType}</div>
      </td>
      <td className="min-w-72 px-4 py-4 align-top">
        <div className="font-medium text-zinc-950">{event.entityTitle}</div>
        <div className="mt-1 text-sm text-zinc-500">{event.entityId}</div>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{event.note}</p>
      </td>
      <td className="px-4 py-4 align-top text-sm text-zinc-600">
        <div className="font-medium text-zinc-800">{event.actorName}</div>
        <div className="mt-1">{event.actorUserId}</div>
      </td>
      <td className="px-4 py-4 align-top text-right text-sm text-zinc-500">
        {new Date(event.createdAt).toLocaleString("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </td>
    </tr>
  );
}

export default function AuditPage() {
  const canReadAudit = hasPermission(mockCurrentUser, "audit:read");
  const dashboardEvents = mockAuditEvents.filter((event) => event.entityType === "dashboard").length;
  const categoryEvents = mockAuditEvents.filter((event) => event.entityType === "category").length;

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Phase 3 - Governance Workflow</p>
            <h1 className="mt-1 text-2xl font-semibold">Audit Log</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Mock audit trail for dashboard, category, and permission activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/review"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Review queue
            </Link>
            <Link
              href="/catalog"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Catalog
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        {!canReadAudit ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Current mock user does not have `audit:read`. This page is visible for design review only.
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Total events</p>
            <strong className="mt-2 block text-3xl font-semibold">{mockAuditEvents.length}</strong>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Dashboard events</p>
            <strong className="mt-2 block text-3xl font-semibold">{dashboardEvents}</strong>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Category events</p>
            <strong className="mt-2 block text-3xl font-semibold">{categoryEvents}</strong>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_200px_140px]">
            <input
              className="h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-500"
              placeholder="Search actor, dashboard, note..."
            />
            <select className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">
              <option>All actions</option>
              <option>dashboard.publish</option>
              <option>dashboard.submit_review</option>
              <option>dashboard.update_embed_url</option>
              <option>category.create_child</option>
            </select>
            <select className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">
              <option>All entity types</option>
              <option>dashboard</option>
              <option>category</option>
              <option>permission</option>
            </select>
            <button className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800">
              Filter
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-4">
            <h2 className="text-lg font-semibold">Audit Events</h2>
            <p className="mt-1 text-sm text-zinc-500">
              This is a mock read model. The real implementation should read from `portal_audit_logs`.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity / Note</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 text-right font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {mockAuditEvents.map((event) => (
                  <AuditRow key={event.id} event={event} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
