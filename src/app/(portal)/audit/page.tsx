export const dynamic = "force-dynamic";

import {
  FilterShell,
  MetricTile,
  PageHeader,
  TableShell,
  buttonStyles,
  fieldStyles,
} from "@/components/dashboard-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { countAuditEvents, listAuditEvents } from "@/lib/db/audit";
import { hasPermission } from "@/lib/permissions";
import type { AuditEvent } from "@/lib/portal-types";

const PAGE_SIZE = 50;

const entityTypes: AuditEvent["entityType"][] = ["dashboard", "category", "permission"];

const actionTone: Record<string, string> = {
  "dashboard.publish": "bg-emerald-50 text-emerald-800",
  "dashboard.reject": "bg-rose-50 text-rose-800",
  "dashboard.submit_review": "bg-amber-50 text-amber-900",
  "dashboard.archive": "bg-[oklch(0.91_0.006_250)] text-[oklch(0.3_0.018_255)]",
  "dashboard.update": "bg-[oklch(0.978_0.012_258)] text-[oklch(0.4_0.13_260)]",
  "dashboard.update_embed_url": "bg-[oklch(0.978_0.012_258)] text-[oklch(0.4_0.13_260)]",
  "category.create_child": "bg-violet-50 text-violet-800",
};

type AuditSearchParams = {
  q?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
  page?: string;
};

function isDateInput(value?: string): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== 0);
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

function AuditRow({ event }: { event: AuditEvent }) {
  return (
    <tr className="border-b border-[oklch(0.91_0.006_250)] last:border-0 hover:bg-[oklch(0.998_0.002_250)]">
      <td className="min-w-56 px-4 py-4 align-top">
        <span
          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
            actionTone[event.action] ?? "bg-[oklch(0.955_0.005_250)] text-[oklch(0.3_0.018_255)]"
          }`}
        >
          {event.action}
        </span>
        <div className="mt-2 text-sm text-[oklch(0.5_0.012_255)]">{event.entityType}</div>
      </td>
      <td className="min-w-80 px-4 py-4 align-top">
        <div className="font-semibold text-[oklch(0.21_0.015_255)]">{event.entityTitle}</div>
        <div className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">{event.entityId}</div>
        <p className="mt-2 text-sm leading-6 text-[oklch(0.5_0.012_255)]">{event.note}</p>
      </td>
      <td className="px-4 py-4 align-top text-sm text-[oklch(0.5_0.012_255)]">
        <div className="font-semibold text-[oklch(0.3_0.018_255)]">{event.actorName}</div>
        <div className="mt-1">{event.actorUserId}</div>
      </td>
      <td className="px-4 py-4 align-top text-right text-sm text-[oklch(0.5_0.012_255)]">
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
  const canReadAudit = hasPermission(currentUser, "audit:read");

  const raw = await searchParams;
  const q = raw.q?.trim() ?? "";
  const action = raw.action ?? "";
  const entity = entityTypes.includes(raw.entity as AuditEvent["entityType"])
    ? (raw.entity as AuditEvent["entityType"])
    : "";
  const from = isDateInput(raw.from) ? raw.from : "";
  const to = isDateInput(raw.to) ? raw.to : "";
  const page = Math.max(1, parseInt(raw.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filter = { q, action, entity, from, to };

  const [events, totalFiltered, totalAll] = await Promise.all([
    listAuditEvents(filter, PAGE_SIZE, offset),
    countAuditEvents(filter),
    countAuditEvents({}),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const baseParams = { q: q || undefined, action: action || undefined, entity: entity || undefined, from: from || undefined, to: to || undefined };

  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <PageHeader
        eyebrow="Governance Workflow"
        title="ประวัติ Audit"
        description="อ่าน trace ของ Dashboard, หมวดหมู่ และสิทธิ์การใช้งาน"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        {!canReadAudit ? (
          <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-4 text-sm font-medium text-[oklch(0.3_0.018_255)]">
            ผู้ใช้จำลองปัจจุบันไม่มีสิทธิ์ `audit:read` หน้านี้แสดงไว้เพื่อดูรูปแบบเท่านั้น
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <MetricTile label="Events ทั้งหมด" value={totalAll} tone="neutral" />
          <MetricTile label="ผลลัพธ์หลังกรอง" value={totalFiltered} tone="info" />
          <MetricTile label="หน้าที่ดูอยู่" value={`${page} / ${totalPages}`} tone="category" />
        </section>

        <FilterShell>
          <form className="grid gap-3 xl:grid-cols-[1fr_220px_160px_150px_150px_120px]">
            <label>
              <span className="sr-only">ค้นหา Audit event</span>
              <input
                name="q"
                className={`${fieldStyles} h-11 w-full`}
                placeholder="ค้นหาด้วยผู้ทำรายการ Dashboard หรือหมายเหตุ..."
                defaultValue={q}
              />
            </label>
            <select name="action" className={`${fieldStyles} h-11 text-[oklch(0.3_0.018_255)]`} defaultValue={action}>
              <option value="">ทุก action</option>
              <option value="dashboard.publish">dashboard.publish</option>
              <option value="dashboard.reject">dashboard.reject</option>
              <option value="dashboard.submit_review">dashboard.submit_review</option>
              <option value="dashboard.archive">dashboard.archive</option>
              <option value="dashboard.update">dashboard.update</option>
              <option value="dashboard.delete">dashboard.delete</option>
              <option value="category.create_root">category.create_root</option>
              <option value="category.create_child">category.create_child</option>
              <option value="category.update">category.update</option>
              <option value="category.delete">category.delete</option>
              <option value="permission.update">permission.update</option>
              <option value="permission.user_status_update">permission.user_status_update</option>
              <option value="user.delete">user.delete</option>
            </select>
            <select name="entity" className={`${fieldStyles} h-11 text-[oklch(0.3_0.018_255)]`} defaultValue={entity}>
              <option value="">ทุกประเภทข้อมูล</option>
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
                className={`${fieldStyles} h-11 w-full text-[oklch(0.3_0.018_255)]`}
                defaultValue={from}
              />
            </label>
            <label>
              <span className="sr-only">ถึงวันที่</span>
              <input
                name="to"
                type="date"
                className={`${fieldStyles} h-11 w-full text-[oklch(0.3_0.018_255)]`}
                defaultValue={to}
              />
            </label>
            <button type="submit" className={`${buttonStyles.primary} h-11 justify-center`}>
              กรอง
            </button>
          </form>
        </FilterShell>

        <TableShell
          title="Audit Events"
          description={`แสดง ${events.length} จาก ${totalFiltered.toLocaleString("th-TH")} รายการ`}
        >
          <table className="w-full border-collapse text-left">
            <thead className="bg-[oklch(0.955_0.005_250)] text-xs uppercase tracking-wide text-[oklch(0.5_0.012_255)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">ข้อมูล / หมายเหตุ</th>
                <th className="px-4 py-3 font-semibold">ผู้ทำรายการ</th>
                <th className="px-4 py-3 text-right font-semibold">เวลา</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <AuditRow key={event.id} event={event} />
              ))}
            </tbody>
          </table>

          {!events.length ? (
            <div className="border-t border-[oklch(0.91_0.006_250)] px-4 py-8 text-center text-sm text-[oklch(0.5_0.012_255)]">
              ไม่พบ Audit event ที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : null}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-[oklch(0.91_0.006_250)] px-4 py-3">
              <p className="text-sm text-[oklch(0.5_0.012_255)]">
                หน้า {page} จาก {totalPages.toLocaleString("th-TH")}
                {" · "}รายการที่ {(offset + 1).toLocaleString("th-TH")}–{Math.min(offset + PAGE_SIZE, totalFiltered).toLocaleString("th-TH")}
              </p>
              <div className="flex gap-2">
                {page > 1 ? (
                  <a
                    href={`/audit${buildQueryString({ ...baseParams, page: page - 1 })}`}
                    className={`${buttonStyles.secondary} h-9 px-3 text-sm`}
                  >
                    ← ก่อนหน้า
                  </a>
                ) : null}
                {page < totalPages ? (
                  <a
                    href={`/audit${buildQueryString({ ...baseParams, page: page + 1 })}`}
                    className={`${buttonStyles.secondary} h-9 px-3 text-sm`}
                  >
                    ถัดไป →
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </TableShell>
      </div>
    </main>
  );
}
