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
  canArchiveDashboard,
  canPublishDashboard,
  canSubmitDashboardForReview,
  canUpdateDashboard,
} from "@/lib/permissions";
import type {
  Dashboard,
  DashboardProvider,
  DashboardStatus,
  PortalUser,
  SensitivityLevel,
} from "@/lib/portal-types";

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

const providers: DashboardProvider[] = [
  "Looker Studio",
  "Superset",
  "Grafana",
  "Metabase",
  "Power BI",
  "Custom",
];
const statuses: DashboardStatus[] = ["draft", "in_review", "published", "rejected", "archived"];
const sensitivities: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];
const sortOptions = ["updated_desc", "updated_asc", "views_desc", "title_asc"] as const;

type CatalogSearchParams = {
  q?: string;
  provider?: string;
  status?: string;
  sensitivity?: string;
  sort?: string;
};

function isProvider(value: string): value is DashboardProvider {
  return providers.includes(value as DashboardProvider);
}

function isStatus(value: string): value is DashboardStatus {
  return statuses.includes(value as DashboardStatus);
}

function isSensitivity(value: string): value is SensitivityLevel {
  return sensitivities.includes(value as SensitivityLevel);
}

function normalizeSearchParams(searchParams: CatalogSearchParams) {
  return {
    q: searchParams.q?.trim() ?? "",
    provider: searchParams.provider && isProvider(searchParams.provider) ? searchParams.provider : "all",
    status: searchParams.status && isStatus(searchParams.status) ? searchParams.status : "all",
    sensitivity:
      searchParams.sensitivity && isSensitivity(searchParams.sensitivity)
        ? searchParams.sensitivity
        : "all",
    sort: sortOptions.includes(searchParams.sort as (typeof sortOptions)[number])
      ? (searchParams.sort as (typeof sortOptions)[number])
      : "updated_desc",
  };
}

function dashboardMatchesQuery(dashboard: Dashboard, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchable = [
    dashboard.title,
    dashboard.description,
    dashboard.owner,
    dashboard.provider,
    dashboard.categoryName,
    dashboard.status,
    dashboard.sensitivity,
    ...dashboard.tags,
  ]
    .join(" ")
    .toLocaleLowerCase("th-TH");

  return searchable.includes(query.toLocaleLowerCase("th-TH"));
}

function filterDashboards(dashboards: Dashboard[], filters: ReturnType<typeof normalizeSearchParams>) {
  return dashboards
    .filter((dashboard) => dashboardMatchesQuery(dashboard, filters.q))
    .filter((dashboard) => filters.provider === "all" || dashboard.provider === filters.provider)
    .filter((dashboard) => filters.status === "all" || dashboard.status === filters.status)
    .filter((dashboard) => filters.sensitivity === "all" || dashboard.sensitivity === filters.sensitivity)
    .sort((first, second) => {
      if (filters.sort === "updated_asc") {
        return new Date(first.updatedAt).getTime() - new Date(second.updatedAt).getTime();
      }
      if (filters.sort === "views_desc") {
        return second.views - first.views;
      }
      if (filters.sort === "title_asc") {
        return first.title.localeCompare(second.title, "th-TH");
      }
      return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
    });
}

function CatalogRow({ currentUser, dashboard }: { currentUser: PortalUser; dashboard: Dashboard }) {
  const canUpdate = canUpdateDashboard(currentUser, dashboard);
  const canPublish = canPublishDashboard(currentUser, dashboard);
  const canSubmit = canSubmitDashboardForReview(currentUser, dashboard);
  const canArchive = canArchiveDashboard(currentUser, dashboard);

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
          <Link
            href={canUpdate ? `/dashboards/${dashboard.id}/edit` : `/dashboards/${dashboard.id}`}
            className={`${buttonStyles.secondary} h-9 px-3 ${!canUpdate ? "pointer-events-none opacity-50" : ""}`}
            aria-disabled={!canUpdate}
          >
            แก้ไข
          </Link>
          <Link
            href={`/dashboards/${dashboard.id}`}
            className={`${buttonStyles.primary} h-9 px-3 ${
              !canSubmit && !(canPublish && dashboard.status === "in_review") && !canArchive
                ? "pointer-events-none opacity-50"
                : ""
            }`}
            aria-disabled={!canSubmit && !(canPublish && dashboard.status === "in_review") && !canArchive}
          >
            Workflow
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const currentUser = await getCurrentUser();
  const filters = normalizeSearchParams(await searchParams);
  const visibleDashboards = await listDashboards(currentUser.id);
  const filteredDashboards = filterDashboards(visibleDashboards, filters);
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
          <MetricTile label="ผลลัพธ์หลังกรอง" value={filteredDashboards.length} tone="neutral" />
        </section>

        <FilterShell>
          <form className="grid gap-3 lg:grid-cols-[1fr_170px_170px_170px_160px_120px]">
            <label>
              <span className="sr-only">ค้นหา Dashboard</span>
              <input
                name="q"
                className={`${fieldStyles} h-11 w-full`}
                placeholder="ค้นหาด้วยชื่อ เจ้าของ tag หรือหมวดหมู่..."
                defaultValue={filters.q}
              />
            </label>
            <select name="provider" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.provider}>
              <option value="all">ทุก provider</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
            <select name="status" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.status}>
              <option value="all">ทุกสถานะ</option>
              <option value="published">เผยแพร่แล้ว</option>
              <option value="in_review">รอตรวจสอบ</option>
              <option value="draft">ฉบับร่าง</option>
              <option value="rejected">ถูกปฏิเสธ</option>
            </select>
            <select
              name="sensitivity"
              className={`${fieldStyles} h-11 text-slate-700`}
              defaultValue={filters.sensitivity}
            >
              <option value="all">ทุกระดับข้อมูล</option>
              {sensitivities.map((sensitivity) => (
                <option key={sensitivity} value={sensitivity}>
                  {sensitivity}
                </option>
              ))}
            </select>
            <select name="sort" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.sort}>
              <option value="updated_desc">อัปเดตล่าสุด</option>
              <option value="updated_asc">อัปเดตเก่าสุด</option>
              <option value="views_desc">ยอดดูสูงสุด</option>
              <option value="title_asc">ชื่อ A-Z</option>
            </select>
            <button type="submit" className={`${buttonStyles.primary} h-11 justify-center`}>
              กรอง
            </button>
          </form>
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
                {filteredDashboards.map((dashboard) => (
                  <CatalogRow key={dashboard.id} currentUser={currentUser} dashboard={dashboard} />
                ))}
              </tbody>
            </table>
            {!filteredDashboards.length ? (
              <div className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                ไม่พบ Dashboard ที่ตรงกับเงื่อนไขการค้นหา
              </div>
            ) : null}
        </TableShell>
      </div>
    </main>
  );
}
