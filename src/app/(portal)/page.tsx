import { buttonStyles, focusRing } from "@/components/dashboard-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listCategories } from "@/lib/db/categories";
import { listDashboardsForUser } from "@/lib/db/dashboards";
import { hasPermission } from "@/lib/permissions";
import type {
  Category,
  Dashboard,
  DashboardProvider,
  DashboardStatus,
  PortalUser,
  SensitivityLevel,
} from "@/lib/portal-types";
import Link from "next/link";
import type { ReactNode } from "react";

const providerStyles: Record<DashboardProvider, string> = {
  "Looker Studio": "border-sky-200 bg-sky-50 text-sky-800",
  Superset: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Grafana: "border-amber-200 bg-amber-50 text-amber-800",
  Metabase: "border-cyan-200 bg-cyan-50 text-cyan-800",
  "Power BI": "border-yellow-200 bg-yellow-50 text-yellow-900",
  Custom: "border-slate-200 bg-slate-100 text-slate-700",
};

const statusStyles: Record<DashboardStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  in_review: "bg-amber-50 text-amber-900",
  published: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
  archived: "bg-slate-200 text-slate-600",
};

const statusLabels: Record<DashboardStatus, string> = {
  draft: "ร่าง",
  in_review: "รอตรวจสอบ",
  published: "เผยแพร่แล้ว",
  rejected: "ตีกลับ",
  archived: "เก็บถาวร",
};

const sensitivityStyles: Record<SensitivityLevel, string> = {
  public: "bg-teal-50 text-teal-800",
  internal: "bg-sky-50 text-sky-800",
  confidential: "bg-orange-50 text-orange-800",
  restricted: "bg-rose-50 text-rose-800",
};

const sensitivityLabels: Record<SensitivityLevel, string> = {
  public: "สาธารณะ",
  internal: "ต้องเข้าสู่ระบบ",
  confidential: "ภายในหน่วยงาน",
  restricted: "จำกัดสิทธิ์",
};

type HomeMode = "viewer" | "creator" | "reviewer" | "admin";

function getHomeMode(user: PortalUser): HomeMode {
  if (hasPermission(user, "permission:manage")) {
    return "admin";
  }

  if (hasPermission(user, "dashboard:publish") || hasPermission(user, "dashboard:approve")) {
    return "reviewer";
  }

  if (hasPermission(user, "dashboard:create")) {
    return "creator";
  }

  return "viewer";
}

function uniqueDashboards(dashboards: Dashboard[]) {
  return dashboards.filter(
    (dashboard, index, list) =>
      list.findIndex((candidate) => candidate.id === dashboard.id) === index,
  );
}

function isActionableForUser(user: PortalUser, dashboard: Dashboard) {
  if (hasPermission(user, "category:create_root")) {
    return true;
  }

  if (dashboard.ownerTeamId === user.teamId) {
    return true;
  }

  return dashboard.ownerUserId === user.id;
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg border border-slate-200 bg-slate-50 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm ${focusRing}`}
    >
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="mt-3 flex items-end justify-between gap-4">
        <strong className="text-3xl font-semibold tracking-tight text-slate-950">{value}</strong>
        <span className="max-w-32 text-right text-sm leading-5 text-slate-500">{detail}</span>
      </span>
    </Link>
  );
}

function RoleBadge({ role }: { role: string }) {
  const label = role
    .replace("system_admin", "ผู้ดูแลระบบ")
    .replace("category_admin", "ผู้ดูแลหมวดรายงาน")
    .replace("project_manager", "ผู้จัดการหน่วยงาน")
    .replace("editor", "ผู้จัดทำรายงาน")
    .replace("viewer", "ผู้ดูรายงาน");

  return (
    <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
      {label}
    </span>
  );
}

function ReportCard({ dashboard }: { dashboard: Dashboard }) {
  const categoryPath = dashboard.categoryPath?.length
    ? dashboard.categoryPath.join(" / ")
    : dashboard.categoryName;

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={sensitivityStyles[dashboard.sensitivity]}>
          {sensitivityLabels[dashboard.sensitivity]}
        </Badge>
        <Badge className={providerStyles[dashboard.provider]}>{dashboard.provider}</Badge>
        <Badge className={statusStyles[dashboard.status]}>{statusLabels[dashboard.status]}</Badge>
      </div>
      <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950">{dashboard.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{dashboard.description}</p>
      <p className="mt-3 text-xs font-semibold text-slate-500">{categoryPath}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500">{dashboard.views.toLocaleString("th-TH")} ครั้ง</span>
        <Link href={`/dashboards/${dashboard.id}`} className={`${buttonStyles.secondary} h-9 px-3`}>
          เปิดรายงาน
        </Link>
      </div>
    </article>
  );
}

function ReportList({
  title,
  description,
  dashboards,
  emptyText,
}: {
  title: string;
  description: string;
  dashboards: Dashboard[];
  emptyText: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          {dashboards.length}
        </span>
      </div>
      {dashboards.length ? (
        <div className="mt-4 grid gap-3">
          {dashboards.slice(0, 4).map((dashboard) => (
            <ReportCard key={dashboard.id} dashboard={dashboard} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          {emptyText}
        </p>
      )}
    </section>
  );
}

function CategoryTree({ categories }: { categories: Category[] }) {
  const visibleCategories = categories.slice(0, 8);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">หมวดรายงาน</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            โครงสร้างหมวดหมู่รองรับหลายระดับตามกลุ่มงานและตัวชี้วัด
          </p>
        </div>
        <Link href="/catalog" className="text-sm font-semibold text-[#005f80] hover:text-slate-950">
          ดูทั้งหมด
        </Link>
      </div>
      <div className="mt-4 space-y-2">
        {visibleCategories.map((category) => (
          <Link
            key={category.id}
            href={`/catalog?category=${category.id}`}
            className={`block rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300 hover:bg-white ${focusRing}`}
            style={{ marginLeft: `${Math.min(category.depth ?? 0, 3) * 10}px` }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">{category.name}</span>
              <span className="text-xs font-semibold text-slate-500">
                {category.dashboardCount.toLocaleString("th-TH")} รายงาน
              </span>
            </div>
            {category.path?.length ? (
              <p className="mt-1 truncate text-xs text-slate-500">{category.path.join(" / ")}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

function getHeroCopy(mode: HomeMode) {
  if (mode === "viewer") {
    return {
      title: "รายงานที่คุณเข้าถึงได้",
      description: "เปิดดูรายงานสาธารณะและรายงานภายในที่อนุญาตตามสิทธิ์ของบัญชีคุณ",
    };
  }

  if (mode === "creator") {
    return {
      title: "จัดการรายงานของหน่วยงาน",
      description: "ติดตามร่าง รายงานที่ต้องปรับปรุง และรายงานที่เผยแพร่แล้วของทีมคุณ",
    };
  }

  if (mode === "reviewer") {
    return {
      title: "ดูแลรายงานและหมวดข้อมูล",
      description: "ติดตามความพร้อมของรายงาน หมวดข้อมูล และข้อจำกัดของ dashboard embed",
    };
  }

  return {
    title: "ภาพรวมระบบรายงาน",
    description: "ติดตามสถานะรายงาน หมวดหมู่ สิทธิ์ผู้ใช้ และประวัติการเปลี่ยนแปลง",
  };
}

export default async function Home() {
  const currentUser = await requireCurrentUser();
  const [dashboards, categories] = await Promise.all([
    listDashboardsForUser(currentUser),
    listCategories(),
  ]);

  const mode = getHomeMode(currentUser);
  const canCreate = hasPermission(currentUser, "dashboard:create");
  const canAudit = hasPermission(currentUser, "audit:read");
  const canManageUsers = hasPermission(currentUser, "permission:manage");
  const heroCopy = getHeroCopy(mode);

  const publishedReports = dashboards
    .filter((dashboard) => dashboard.status === "published")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const publicReports = publishedReports.filter((dashboard) => dashboard.sensitivity === "public");
  const loginRequiredReports = publishedReports.filter((dashboard) => dashboard.sensitivity !== "public");
  const myTeamReports = dashboards.filter((dashboard) => dashboard.ownerTeamId === currentUser.teamId);
  const myWorkingReports = dashboards.filter(
    (dashboard) =>
      isActionableForUser(currentUser, dashboard) &&
      (dashboard.status === "draft" || dashboard.status === "rejected" || dashboard.status === "in_review"),
  );
  const recommendedReports = uniqueDashboards([
    ...publishedReports.filter((dashboard) => dashboard.isPinned),
    ...[...publishedReports].sort((a, b) => b.views - a.views),
  ]).slice(0, 4);

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#005f80]">ระบบบริการรายงานสุขภาพ</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {heroCopy.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{heroCopy.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/catalog" className={`${buttonStyles.primary} h-10`}>
                  ดูรายงานทั้งหมด
                </Link>
                {canCreate ? (
                  <Link href="/dashboards/new" className={`${buttonStyles.secondary} h-10`}>
                    เพิ่มรายงาน
                  </Link>
                ) : null}
                <Link href="/public" className={`${buttonStyles.secondary} h-10`}>
                  หน้าสาธารณะ
                </Link>
              </div>
            </div>

            <aside className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-500">เข้าสู่ระบบในชื่อ</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{currentUser.name}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {currentUser.title} · {currentUser.department}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {currentUser.roles.map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </div>
            </aside>
          </div>

          <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="รายงานที่เปิดได้"
              value={String(publishedReports.length)}
              detail="ตามสิทธิ์ปัจจุบัน"
              href="/catalog"
            />
            <MetricCard
              label="รายงานสาธารณะ"
              value={String(publicReports.length)}
              detail="ประชาชนเห็นได้"
              href="/public"
            />
            <MetricCard
              label="ต้องเข้าสู่ระบบ"
              value={String(loginRequiredReports.length)}
              detail="รายงานภายใน"
              href="/catalog"
            />
            <MetricCard
              label={canAudit ? "หมวดรายงาน" : "ทีมของฉัน"}
              value={String(canAudit ? categories.length : myTeamReports.length)}
              detail={canAudit ? "ทุกระดับชั้น" : "รายงานที่เกี่ยวข้อง"}
              href={canAudit ? "/admin/categories" : "/catalog"}
            />
          </section>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {mode === "viewer" ? (
            <>
              <ReportList
                title="รายงานแนะนำ"
                description="รายงานที่เผยแพร่แล้วและเหมาะกับการเปิดดูบ่อย"
                dashboards={recommendedReports}
                emptyText="ยังไม่มีรายงานแนะนำในขณะนี้"
              />
              <ReportList
                title="อัปเดตล่าสุด"
                description="รายงานที่มีการปรับปรุงล่าสุดตามสิทธิ์ของคุณ"
                dashboards={publishedReports}
                emptyText="ยังไม่มีรายงานที่เปิดให้บัญชีนี้ดู"
              />
            </>
          ) : (
            <>
              <ReportList
                title="งานของฉันและทีม"
                description="ร่าง รายงานตีกลับ และรายการที่ทีมของคุณกำลังจัดการ"
                dashboards={myWorkingReports}
                emptyText="ไม่มีงานค้างของทีมในขณะนี้"
              />
              <ReportList
                title="รายงานเผยแพร่ล่าสุด"
                description="รายงานที่พร้อมเปิดดูจากระบบหลัง login"
                dashboards={publishedReports}
                emptyText="ยังไม่มีรายงานเผยแพร่"
              />
            </>
          )}
        </div>

        <div className="space-y-6">
          <CategoryTree categories={categories} />
          {canManageUsers ? (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-base font-semibold text-slate-950">ดูแลระบบ</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                จัดการสิทธิ์ผู้ใช้ หมวดรายงาน และตรวจสอบประวัติการเปลี่ยนแปลง
              </p>
              <div className="mt-4 grid gap-2">
                <Link href="/admin/users" className={`${buttonStyles.secondary} h-10 justify-center`}>
                  ผู้ใช้งานและสิทธิ์
                </Link>
                <Link href="/audit" className={`${buttonStyles.secondary} h-10 justify-center`}>
                  ประวัติ Audit
                </Link>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}
