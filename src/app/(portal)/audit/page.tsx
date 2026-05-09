import {
  FilterShell,
  MetricTile,
  PageHeader,
  TableShell,
  buttonStyles,
  fieldStyles,
} from "@/components/dashboard-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listAuditEvents } from "@/lib/db/audit";
import { hasPermission } from "@/lib/permissions";
import type { AuditEvent } from "@/lib/portal-types";

const entityTypes: AuditEvent["entityType"][] = ["dashboard", "category", "permission"];

const actionTone: Record<string, string> = {
  "dashboard.publish": "bg-emerald-50 text-emerald-800",
  "dashboard.reject": "bg-rose-50 text-rose-800",
  "dashboard.submit_review": "bg-amber-50 text-amber-900",
  "dashboard.archive": "bg-slate-200 text-slate-700",
  "dashboard.update": "bg-sky-50 text-sky-800",
  "dashboard.update_embed_url": "bg-sky-50 text-sky-800",
  "category.create_child": "bg-violet-50 text-violet-800",
};

type AuditSearchParams = {
  q?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
};

function normalizeSearchParams(searchParams: AuditSearchParams, events: AuditEvent[]) {
  const actionOptions = Array.from(new Set(events.map((event) => event.action))).sort();
  const entity = entityTypes.includes(searchParams.entity as AuditEvent["entityType"])
    ? (searchParams.entity as AuditEvent["entityType"])
    : "all";

  return {
    q: searchParams.q?.trim() ?? "",
    action: searchParams.action && actionOptions.includes(searchParams.action) ? searchParams.action : "all",
    entity,
    from: isDateInput(searchParams.from) ? searchParams.from : "",
    to: isDateInput(searchParams.to) ? searchParams.to : "",
    actionOptions,
  };
}

function isDateInput(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function auditMatchesQuery(event: AuditEvent, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchable = [
    event.action,
    event.entityType,
    event.entityId,
    event.entityTitle,
    event.note,
    event.actorName,
    event.actorUserId,
  ]
    .join(" ")
    .toLocaleLowerCase("th-TH");

  return searchable.includes(query.toLocaleLowerCase("th-TH"));
}

function filterAuditEvents(events: AuditEvent[], filters: ReturnType<typeof normalizeSearchParams>) {
  const fromTime = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
  const toTime = filters.to ? new Date(`${filters.to}T23:59:59.999`).getTime() : null;

  return events.filter((event) => {
    const eventTime = new Date(event.createdAt).getTime();

    return (
      auditMatchesQuery(event, filters.q) &&
      (filters.action === "all" || event.action === filters.action) &&
      (filters.entity === "all" || event.entityType === filters.entity) &&
      (fromTime === null || eventTime >= fromTime) &&
      (toTime === null || eventTime <= toTime)
    );
  });
}

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

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<AuditSearchParams>;
}) {
  const currentUser = await requireCurrentUser();
  const auditEvents = await listAuditEvents();
  const filters = normalizeSearchParams(await searchParams, auditEvents);
  const filteredAuditEvents = filterAuditEvents(auditEvents, filters);
  const canReadAudit = hasPermission(currentUser, "audit:read");
  const dashboardEvents = auditEvents.filter((event) => event.entityType === "dashboard").length;

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="Governance Workflow"
        title="ประวัติ Audit"
        description="อ่าน trace ของ Dashboard, หมวดหมู่ และสิทธิ์การใช้งาน"
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
          <MetricTile label="ผลลัพธ์หลังกรอง" value={filteredAuditEvents.length} tone="category" />
        </section>

        <FilterShell>
          <form className="grid gap-3 xl:grid-cols-[1fr_220px_160px_150px_150px_120px]">
            <label>
              <span className="sr-only">ค้นหา Audit event</span>
              <input
                name="q"
                className={`${fieldStyles} h-11 w-full`}
                placeholder="ค้นหาด้วยผู้ทำรายการ Dashboard หรือหมายเหตุ..."
                defaultValue={filters.q}
              />
            </label>
            <select name="action" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.action}>
              <option value="all">ทุก action</option>
              {filters.actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <select name="entity" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.entity}>
              <option value="all">ทุกประเภทข้อมูล</option>
              {entityTypes.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {entityType}
                </option>
              ))}
            </select>
            <label>
              <span className="sr-only">จากวันที่</span>
              <input
                name="from"
                type="date"
                className={`${fieldStyles} h-11 w-full text-slate-700`}
                defaultValue={filters.from}
              />
            </label>
            <label>
              <span className="sr-only">ถึงวันที่</span>
              <input
                name="to"
                type="date"
                className={`${fieldStyles} h-11 w-full text-slate-700`}
                defaultValue={filters.to}
              />
            </label>
            <button type="submit" className={`${buttonStyles.primary} h-11 justify-center`}>
              กรอง
            </button>
          </form>
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
                {filteredAuditEvents.map((event) => (
                  <AuditRow key={event.id} event={event} />
                ))}
              </tbody>
            </table>
            {!filteredAuditEvents.length ? (
              <div className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                ไม่พบ Audit event ที่ตรงกับเงื่อนไขการค้นหา
              </div>
            ) : null}
        </TableShell>
      </div>
    </main>
  );
}
