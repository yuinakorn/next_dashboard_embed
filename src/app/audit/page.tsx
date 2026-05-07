import {
  FilterShell,
  MetricTile,
  PageHeader,
  TableShell,
  buttonStyles,
  fieldStyles,
} from "@/components/dashboard-ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listAuditEvents } from "@/lib/db/audit";
import { hasPermission } from "@/lib/permissions";
import type { AuditEvent } from "@/lib/portal-types";

const actionTone: Record<string, string> = {
  "dashboard.publish": "bg-emerald-50 text-emerald-800",
  "dashboard.reject": "bg-rose-50 text-rose-800",
  "dashboard.submit_review": "bg-amber-50 text-amber-900",
  "dashboard.update_embed_url": "bg-sky-50 text-sky-800",
  "category.create_child": "bg-violet-50 text-violet-800",
};

function AuditRow({ event }: { event: AuditEvent }) {
  return (
    <tr className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
      <td className="min-w-56 px-4 py-4 align-top">
        <span
          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
            actionTone[event.action] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {event.action}
        </span>
        <div className="mt-2 text-sm text-slate-500">{event.entityType}</div>
      </td>
      <td className="min-w-80 px-4 py-4 align-top">
        <div className="font-semibold text-slate-950">{event.entityTitle}</div>
        <div className="mt-1 text-sm text-slate-500">{event.entityId}</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{event.note}</p>
      </td>
      <td className="px-4 py-4 align-top text-sm text-slate-600">
        <div className="font-semibold text-slate-800">{event.actorName}</div>
        <div className="mt-1">{event.actorUserId}</div>
      </td>
      <td className="px-4 py-4 align-top text-right text-sm text-slate-500">
        {new Date(event.createdAt).toLocaleString("th-TH", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </td>
    </tr>
  );
}

export default async function AuditPage() {
  const currentUser = await getCurrentUser();
  const auditEvents = await listAuditEvents();
  const canReadAudit = hasPermission(currentUser, "audit:read");
  const dashboardEvents = auditEvents.filter((event) => event.entityType === "dashboard").length;
  const categoryEvents = auditEvents.filter((event) => event.entityType === "category").length;

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="Governance Workflow"
        title="ประวัติ Audit"
        description="อ่าน trace ของ Dashboard, หมวดหมู่ และสิทธิ์การใช้งาน"
        actions={[
          { href: "/review", label: "คิวตรวจสอบ" },
          { href: "/catalog", label: "Catalog" },
          { href: "/", label: "หน้าหลัก", primary: true },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        {!canReadAudit ? (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
            ผู้ใช้จำลองปัจจุบันไม่มีสิทธิ์ `audit:read` หน้านี้แสดงไว้เพื่อดูรูปแบบเท่านั้น
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricTile label="Events ทั้งหมด" value={auditEvents.length} tone="neutral" />
          <MetricTile label="Events ของ Dashboard" value={dashboardEvents} tone="info" />
          <MetricTile label="Events ของหมวดหมู่" value={categoryEvents} tone="category" />
        </section>

        <FilterShell>
          <div className="grid gap-3 md:grid-cols-[1fr_200px_200px_140px]">
            <label>
              <span className="sr-only">ค้นหา Audit event</span>
              <input
                className={`${fieldStyles} h-11 w-full`}
                placeholder="ค้นหาด้วยผู้ทำรายการ Dashboard หรือหมายเหตุ..."
              />
            </label>
            <select className={`${fieldStyles} h-11 text-slate-700`}>
              <option>ทุก action</option>
              <option>dashboard.publish</option>
              <option>dashboard.submit_review</option>
              <option>dashboard.update_embed_url</option>
              <option>category.create_child</option>
            </select>
            <select className={`${fieldStyles} h-11 text-slate-700`}>
              <option>ทุกประเภทข้อมูล</option>
              <option>dashboard</option>
              <option>category</option>
              <option>permission</option>
            </select>
            <button className={`${buttonStyles.primary} h-11 justify-center`}>
              กรอง
            </button>
          </div>
        </FilterShell>

        <TableShell
          title="Audit Events"
          description="อ่านประวัติการเปลี่ยนแปลงจาก `portal_audit_logs` โดยตรง"
        >
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">ข้อมูล / หมายเหตุ</th>
                  <th className="px-4 py-3 font-semibold">ผู้ทำรายการ</th>
                  <th className="px-4 py-3 text-right font-semibold">เวลา</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((event) => (
                  <AuditRow key={event.id} event={event} />
                ))}
              </tbody>
            </table>
        </TableShell>
      </div>
    </main>
  );
}
