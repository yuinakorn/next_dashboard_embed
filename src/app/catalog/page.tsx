import Link from "next/link";
import {
  Badge,
  FilterShell,
  MetricTile,
  PageHeader,
  TableShell,
  buttonStyles,
  fieldStyles,
} from "@/components/dashboard-ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listDashboards } from "@/lib/db/dashboards";
import { getEmbedStatusTone } from "@/lib/embed-policy";
import {
  canPublishDashboard,
  canUpdateDashboard,
  getUserPermissions,
} from "@/lib/permissions";
import type { Dashboard, DashboardStatus, PortalUser, SensitivityLevel } from "@/lib/portal-types";

export const dynamic = "force-dynamic";

const statusTone: Record<DashboardStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_review: "bg-amber-50 text-amber-900",
  published: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
  archived: "bg-slate-200 text-slate-600",
};

const sensitivityTone: Record<SensitivityLevel, string> = {
  public: "bg-teal-50 text-teal-800",
  internal: "bg-sky-50 text-sky-800",
  confidential: "bg-orange-50 text-orange-800",
  restricted: "bg-rose-50 text-rose-800",
};

function CatalogRow({ currentUser, dashboard }: { currentUser: PortalUser; dashboard: Dashboard }) {
  const canUpdate = canUpdateDashboard(currentUser, dashboard);
  const canPublish = canPublishDashboard(currentUser, dashboard);

  return (
    <tr className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
      <td className="min-w-80 px-4 py-4 align-top">
        <div className="font-semibold text-slate-950">{dashboard.title}</div>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{dashboard.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {dashboard.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-4 align-top text-sm text-slate-600">
        <div className="font-semibold text-slate-800">{dashboard.provider}</div>
        <div className="mt-1 max-w-56">{dashboard.categoryName}</div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex flex-col gap-2">
          <Badge className={statusTone[dashboard.status]}>{dashboard.status}</Badge>
          <Badge className={sensitivityTone[dashboard.sensitivity]}>{dashboard.sensitivity}</Badge>
          <span
            className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getEmbedStatusTone(dashboard.embedStatus)}`}
          >
            {dashboard.embedStatus}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 align-top text-sm text-slate-600">
        <div className="font-semibold text-slate-800">{dashboard.owner}</div>
        <div className="mt-1">{dashboard.updatedAt}</div>
      </td>
      <td className="px-4 py-4 align-top text-right">
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboards/${dashboard.id}`}
            className={`${buttonStyles.secondary} h-9 px-3`}
          >
            เปิด
          </Link>
          <button
            className={`${buttonStyles.secondary} h-9 px-3`}
            disabled={!canUpdate}
          >
            แก้ไข
          </button>
          <button
            className={`${buttonStyles.primary} h-9 px-3`}
            disabled={!canPublish}
          >
            เผยแพร่
          </button>
        </div>
      </td>
    </tr>
  );
}

export default async function CatalogPage() {
  const currentUser = await getCurrentUser();
  const visibleDashboards = await listDashboards(currentUser.id);
  const permissions = getUserPermissions(currentUser);
  const reviewCount = visibleDashboards.filter(
    (dashboard) => dashboard.status === "in_review" && dashboard.ownerTeamId === currentUser.teamId,
  ).length;

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="ระบบภายใน"
        title="คลัง Dashboard"
        description="ค้นหา จัดการสถานะ และตรวจสิทธิ์การทำงานจาก SSO จำลอง"
        actions={[
          { href: "/", label: "หน้าหลัก" },
          { href: "/review", label: "คิวตรวจสอบ" },
          { href: "/audit", label: "ประวัติ Audit" },
          { href: "/dashboards/new", label: "สร้าง Dashboard", primary: true },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        <section className="grid gap-4 md:grid-cols-3">
          <MetricTile label="Dashboard ที่มองเห็นได้" value={visibleDashboards.length} tone="info" />
          <MetricTile label="คิวตรวจสอบของทีม" value={reviewCount} tone="review" />
          <MetricTile label="สิทธิ์ของผู้ใช้ปัจจุบัน" value={permissions.length} tone="neutral" />
        </section>

        <FilterShell>
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_140px]">
            <label>
              <span className="sr-only">ค้นหา Dashboard</span>
              <input
                className={`${fieldStyles} h-11 w-full`}
                placeholder="ค้นหาด้วยชื่อ เจ้าของ tag หรือหมวดหมู่..."
              />
            </label>
            <select className={`${fieldStyles} h-11 text-slate-700`}>
              <option>ทุกสถานะ</option>
              <option>เผยแพร่แล้ว</option>
              <option>รอตรวจสอบ</option>
              <option>ฉบับร่าง</option>
            </select>
            <select className={`${fieldStyles} h-11 text-slate-700`}>
              <option>ทุกระดับข้อมูล</option>
              <option>Public</option>
              <option>Internal</option>
              <option>Confidential</option>
            </select>
            <button className={`${buttonStyles.primary} h-11 justify-center`}>
              กรอง
            </button>
          </div>
        </FilterShell>

        <TableShell
          title="รายการ Dashboard"
          description="ปุ่มดำเนินการจะเปิดหรือปิดตามสิทธิ์ของผู้ใช้จาก SSO จำลอง"
        >
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Dashboard</th>
                  <th className="px-4 py-3 font-semibold">Provider / หมวดหมู่</th>
                  <th className="px-4 py-3 font-semibold">สถานะกำกับดูแล</th>
                  <th className="px-4 py-3 font-semibold">เจ้าของ</th>
                  <th className="px-4 py-3 text-right font-semibold">การทำงาน</th>
                </tr>
              </thead>
              <tbody>
                {visibleDashboards.map((dashboard) => (
                  <CatalogRow key={dashboard.id} currentUser={currentUser} dashboard={dashboard} />
                ))}
              </tbody>
            </table>
        </TableShell>
      </div>
    </main>
  );
}
