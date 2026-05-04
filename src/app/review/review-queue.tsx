"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getEmbedStatusTone } from "@/lib/embed-policy";
import { canPublishDashboard } from "@/lib/permissions";
import type { AuditEvent, Dashboard, PortalUser } from "@/lib/portal-types";

type ReviewDecision = "approve" | "reject";

function createAuditEvent({
  user,
  dashboard,
  action,
  note,
}: {
  user: PortalUser;
  dashboard: Dashboard;
  action: string;
  note: string;
}): AuditEvent {
  return {
    id: `audit-${Date.now()}-${dashboard.id}`,
    actorUserId: user.id,
    actorName: user.name,
    action,
    entityType: "dashboard",
    entityId: dashboard.id,
    entityTitle: dashboard.title,
    note,
    createdAt: new Date().toISOString(),
  };
}

function ReviewCard({
  dashboard,
  currentUser,
  onDecision,
}: {
  dashboard: Dashboard;
  currentUser: PortalUser;
  onDecision: (dashboard: Dashboard, decision: ReviewDecision, note: string) => void;
}) {
  const [note, setNote] = useState("");
  const canPublish = canPublishDashboard(currentUser, dashboard);

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
              {dashboard.status}
            </span>
            <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
              {dashboard.sensitivity}
            </span>
            <span
              className={`rounded-md border px-2 py-1 text-xs font-medium ${getEmbedStatusTone(dashboard.embedStatus)}`}
            >
              {dashboard.embedStatus}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold leading-7 text-zinc-950">{dashboard.title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{dashboard.description}</p>
          <div className="mt-3 grid gap-2 text-sm text-zinc-500 md:grid-cols-2">
            <div>
              <span className="font-medium text-zinc-700">Provider:</span> {dashboard.provider}
            </div>
            <div>
              <span className="font-medium text-zinc-700">Category:</span> {dashboard.categoryName}
            </div>
            <div>
              <span className="font-medium text-zinc-700">Owner:</span> {dashboard.owner}
            </div>
            <div>
              <span className="font-medium text-zinc-700">Updated:</span> {dashboard.updatedAt}
            </div>
          </div>
        </div>
        <Link
          href={`/dashboards/${dashboard.id}`}
          className="inline-flex h-10 w-fit items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Preview
        </Link>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm leading-6 text-zinc-600">
        {dashboard.embedStatusReason}
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-zinc-700">Review note</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 bg-white px-3 py-3 text-sm leading-6 outline-none placeholder:text-zinc-400 focus:border-zinc-500"
          placeholder="ระบุเหตุผลการอนุมัติ หรือสิ่งที่ต้องแก้ไขก่อนเผยแพร่"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="h-10 rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canPublish}
          onClick={() => onDecision(dashboard, "reject", note)}
        >
          Reject
        </button>
        <button
          type="button"
          className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canPublish}
          onClick={() => onDecision(dashboard, "approve", note)}
        >
          Approve and publish
        </button>
      </div>
      {!canPublish ? (
        <p className="mt-3 text-right text-sm text-zinc-500">
          Current mock user can view this item but does not have publish permission for this category.
        </p>
      ) : null}
    </article>
  );
}

export function ReviewQueue({
  currentUser,
  initialDashboards,
}: {
  currentUser: PortalUser;
  initialDashboards: Dashboard[];
}) {
  const [dashboards, setDashboards] = useState(initialDashboards);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const pendingDashboards = useMemo(
    () => dashboards.filter((dashboard) => dashboard.status === "in_review"),
    [dashboards],
  );
  const resolvedDashboards = useMemo(
    () => dashboards.filter((dashboard) => dashboard.status === "published" || dashboard.status === "rejected"),
    [dashboards],
  );

  function handleDecision(dashboard: Dashboard, decision: ReviewDecision, note: string) {
    const nextStatus = decision === "approve" ? "published" : "rejected";
    const action = decision === "approve" ? "dashboard.publish" : "dashboard.reject";
    const fallbackNote =
      decision === "approve"
        ? "Approved from mock review queue."
        : "Rejected from mock review queue.";

    setDashboards((current) =>
      current.map((item) =>
        item.id === dashboard.id
          ? {
              ...item,
              status: nextStatus,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : item,
      ),
    );
    setAuditEvents((current) => [
      createAuditEvent({
        user: currentUser,
        dashboard,
        action,
        note: note.trim() || fallbackNote,
      }),
      ...current,
    ]);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Pending review</p>
          <strong className="mt-2 block text-3xl font-semibold">{pendingDashboards.length}</strong>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Resolved in session</p>
          <strong className="mt-2 block text-3xl font-semibold">{resolvedDashboards.length}</strong>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Audit events</p>
          <strong className="mt-2 block text-3xl font-semibold">{auditEvents.length}</strong>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950">Review Queue</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Mock workflow for approve/reject before dashboards become published.
          </p>
        </div>
        {pendingDashboards.length ? (
          pendingDashboards.map((dashboard) => (
            <ReviewCard
              key={dashboard.id}
              dashboard={dashboard}
              currentUser={currentUser}
              onDecision={handleDecision}
            />
          ))
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            No dashboards are waiting for review.
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-4 py-4">
          <h2 className="text-lg font-semibold">Session Audit Trail</h2>
          <p className="mt-1 text-sm text-zinc-500">
            These events are held in client state only. A later database layer should persist them.
          </p>
        </div>
        {auditEvents.length ? (
          <div className="divide-y divide-zinc-100">
            {auditEvents.map((event) => (
              <div key={event.id} className="grid gap-2 px-4 py-4 text-sm md:grid-cols-[180px_1fr_180px]">
                <div className="font-medium text-zinc-800">{event.action}</div>
                <div>
                  <div className="font-medium text-zinc-950">{event.entityTitle}</div>
                  <p className="mt-1 text-zinc-500">{event.note}</p>
                </div>
                <div className="text-zinc-500 md:text-right">
                  <div>{event.actorName}</div>
                  <div className="mt-1">{new Date(event.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">No audit events in this session.</div>
        )}
      </section>
    </div>
  );
}
