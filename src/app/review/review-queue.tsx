"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MetricTile, buttonStyles, fieldStyles } from "@/components/dashboard-ui";
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
  isDeciding,
}: {
  dashboard: Dashboard;
  currentUser: PortalUser;
  onDecision: (dashboard: Dashboard, decision: ReviewDecision, note: string) => void;
  isDeciding: boolean;
}) {
  const [note, setNote] = useState("");
  const canPublish = canPublishDashboard(currentUser, dashboard);

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
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
          </div>
          <h2 className="mt-3 text-xl font-semibold leading-7 tracking-tight text-slate-950">{dashboard.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{dashboard.description}</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
            <div>
              <span className="font-semibold text-slate-700">Provider:</span> {dashboard.provider}
            </div>
            <div>
              <span className="font-semibold text-slate-700">หมวดหมู่:</span> {dashboard.categoryName}
            </div>
            <div>
              <span className="font-semibold text-slate-700">เจ้าของ:</span> {dashboard.owner}
            </div>
            <div>
              <span className="font-semibold text-slate-700">อัปเดต:</span> {dashboard.updatedAt}
            </div>
          </div>
        </div>
        <Link
          href={`/dashboards/${dashboard.id}`}
          className={`${buttonStyles.secondary} h-10 w-fit`}
        >
          ดูตัวอย่าง
        </Link>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
        {dashboard.embedStatusReason}
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-slate-700">หมายเหตุการตรวจสอบ</span>
        <textarea
          className={`${fieldStyles} mt-2 min-h-24 w-full py-3 leading-6`}
          placeholder="ระบุเหตุผลการอนุมัติ หรือสิ่งที่ต้องแก้ไขก่อนเผยแพร่"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className={`${buttonStyles.danger} h-10`}
          disabled={!canPublish || isDeciding}
          onClick={() => onDecision(dashboard, "reject", note)}
        >
          {isDeciding ? "กำลังบันทึก..." : "ปฏิเสธ"}
        </button>
        <button
          type="button"
          className={`${buttonStyles.primary} h-10`}
          disabled={!canPublish || isDeciding}
          onClick={() => onDecision(dashboard, "approve", note)}
        >
          {isDeciding ? "กำลังบันทึก..." : "อนุมัติและเผยแพร่"}
        </button>
      </div>
      {!canPublish ? (
        <p className="mt-3 text-right text-sm text-slate-500">
          ผู้ใช้จำลองปัจจุบันมองเห็นรายการนี้ได้ แต่ไม่มีสิทธิ์เผยแพร่ในหมวดหมู่นี้
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
  const [decisionDashboardId, setDecisionDashboardId] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const pendingDashboards = useMemo(
    () => dashboards.filter((dashboard) => dashboard.status === "in_review"),
    [dashboards],
  );
  const resolvedDashboards = useMemo(
    () => dashboards.filter((dashboard) => dashboard.status === "published" || dashboard.status === "rejected"),
    [dashboards],
  );

  async function handleDecision(dashboard: Dashboard, decision: ReviewDecision, note: string) {
    const action = decision === "approve" ? "dashboard.publish" : "dashboard.reject";
    const fallbackNote =
      decision === "approve"
        ? "Approved from review queue."
        : "Rejected from review queue.";

    setDecisionDashboardId(dashboard.id);
    setDecisionError(null);

    try {
      const response = await fetch(`/api/dashboards/${dashboard.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision, note }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "ไม่สามารถบันทึกผลการตรวจสอบได้");
      }

      const reviewedDashboard = payload.dashboard as Dashboard;
      setDashboards((current) =>
        current.map((item) => (item.id === dashboard.id ? reviewedDashboard : item)),
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "ไม่สามารถบันทึกผลการตรวจสอบได้";
      setDecisionError(message);
    } finally {
      setDecisionDashboardId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricTile label="รอตรวจสอบ" value={pendingDashboards.length} tone="review" />
        <MetricTile label="ดำเนินการในรอบนี้" value={resolvedDashboards.length} tone="success" />
        <MetricTile label="Audit events" value={auditEvents.length} tone="neutral" />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">คิวตรวจสอบ</h2>
          <p className="mt-1 text-sm text-slate-500">
            Workflow จำลองสำหรับอนุมัติหรือปฏิเสธก่อนเผยแพร่ Dashboard
          </p>
        </div>
        {decisionError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
            {decisionError}
          </div>
        ) : null}
        {pendingDashboards.length ? (
          pendingDashboards.map((dashboard) => (
            <ReviewCard
              key={dashboard.id}
              dashboard={dashboard}
              currentUser={currentUser}
              onDecision={handleDecision}
              isDeciding={decisionDashboardId === dashboard.id}
            />
          ))
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            ไม่มี Dashboard ที่รอตรวจสอบ
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4">
          <h2 className="text-lg font-semibold">Audit Trail ในรอบนี้</h2>
          <p className="mt-1 text-sm text-slate-500">
            ระบบบันทึกผลการตรวจสอบลงฐานข้อมูล และแสดงรายการที่เกิดขึ้นในรอบการใช้งานนี้
          </p>
        </div>
        {auditEvents.length ? (
          <div className="divide-y divide-slate-200">
            {auditEvents.map((event) => (
              <div key={event.id} className="grid gap-2 px-4 py-4 text-sm md:grid-cols-[180px_1fr_180px]">
                <div className="font-semibold text-slate-800">{event.action}</div>
                <div>
                  <div className="font-semibold text-slate-950">{event.entityTitle}</div>
                  <p className="mt-1 text-slate-500">{event.note}</p>
                </div>
                <div className="text-slate-500 md:text-right">
                  <div>{event.actorName}</div>
                  <div className="mt-1">{new Date(event.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-500">ยังไม่มี Audit event ในรอบนี้</div>
        )}
      </section>
    </div>
  );
}
