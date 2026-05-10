import { buttonStyles } from "@/components/dashboard-ui";
import { palette } from "@/lib/design-tokens";
import { requireCurrentUser } from "@/lib/auth/require-current-user";

export const dynamic = "force-dynamic";
import { listCategories } from "@/lib/db/categories";
import { listDashboardsForUser } from "@/lib/db/dashboards";
import { hasPermission } from "@/lib/permissions";
import type {
  Category,
  Dashboard,
  DashboardStatus,
  PortalUser,
  SensitivityLevel,
} from "@/lib/portal-types";
import Link from "next/link";

const statusStyle: Record<DashboardStatus, { dot: string; ink: string; label: string }> = {
  draft: { dot: palette.inkFaint, ink: palette.inkMuted, label: "ร่าง" },
  in_review: { dot: palette.amber, ink: palette.amberDeep, label: "รอตรวจ" },
  published: { dot: palette.emerald, ink: palette.emeraldDeep, label: "เผยแพร่" },
  rejected: { dot: palette.rose, ink: palette.roseDeep, label: "ตีกลับ" },
  archived: { dot: palette.inkFaint, ink: palette.inkFaint, label: "เก็บถาวร" },
};

const sensitivityLabels: Record<SensitivityLevel, string> = {
  public: "สาธารณะ",
  internal: "ต้องเข้าสู่ระบบ",
  confidential: "ภายในหน่วยงาน",
  restricted: "จำกัดสิทธิ์",
};

type HomeMode = "viewer" | "creator" | "reviewer" | "admin";

function getHomeMode(user: PortalUser): HomeMode {
  if (hasPermission(user, "permission:manage")) return "admin";
  if (hasPermission(user, "dashboard:publish") || hasPermission(user, "dashboard:approve")) return "reviewer";
  if (hasPermission(user, "dashboard:create")) return "creator";
  return "viewer";
}

function uniqueDashboards(dashboards: Dashboard[]) {
  return dashboards.filter(
    (dashboard, index, list) =>
      list.findIndex((candidate) => candidate.id === dashboard.id) === index,
  );
}

function isActionableForUser(user: PortalUser, dashboard: Dashboard) {
  if (hasPermission(user, "category:create_root")) return true;
  if (dashboard.ownerTeamId === user.teamId) return true;
  return dashboard.ownerUserId === user.id;
}

function KpiCell({
  label,
  value,
  accent,
  detail,
}: {
  label: string;
  value: number;
  accent: string;
  detail?: string;
}) {
  return (
    <div className="px-5 py-4" style={{ background: palette.paper }}>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
          aria-hidden="true"
        />
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: palette.inkMuted }}
        >
          {label}
        </p>
      </div>
      <strong
        className="mt-1 block text-[26px] font-semibold leading-tight tracking-tight tabular-nums"
        style={{ color: palette.ink }}
      >
        {value.toLocaleString("th-TH")}
      </strong>
      {detail ? (
        <p className="mt-1 text-xs" style={{ color: palette.inkFaint }}>
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const label = role
    .replace("system_admin", "ผู้ดูแลระบบ")
    .replace("category_admin", "ผู้ดูแลหมวดรายงาน")
    .replace("project_manager", "ผู้จัดการหน่วยงาน")
    .replace("editor", "ผู้จัดทำรายงาน")
    .replace("viewer", "ผู้ดูรายงาน");

  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold"
      style={{ background: palette.muted, color: palette.inkMuted }}
    >
      {label}
    </span>
  );
}

function ReportRow({ dashboard }: { dashboard: Dashboard }) {
  const status = statusStyle[dashboard.status];
  const categoryPath = dashboard.categoryPath?.length
    ? dashboard.categoryPath.join(" / ")
    : dashboard.categoryName;

  return (
    <article
      className="group flex flex-col gap-3 rounded-xl px-4 py-3.5 transition-shadow duration-150 hover:shadow-[0_2px_12px_-4px_oklch(0.3_0.02_255/0.1)] sm:flex-row sm:items-center sm:justify-between"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          <span className="inline-flex items-center gap-1.5" style={{ color: status.ink }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: status.dot }}
              aria-hidden="true"
            />
            <span className="font-semibold">{status.label}</span>
          </span>
          <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
          <span style={{ color: palette.inkMuted }} className="font-medium">
            {sensitivityLabels[dashboard.sensitivity]}
          </span>
          <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
          <span style={{ color: palette.inkFaint }}>{dashboard.provider}</span>
        </div>
        <h3
          className="mt-1.5 truncate text-base font-semibold leading-6"
          style={{ color: palette.ink }}
        >
          {dashboard.title}
        </h3>
        <p className="mt-0.5 truncate text-[13px] leading-5" style={{ color: palette.inkFaint }}>
          {categoryPath} · {dashboard.views.toLocaleString("th-TH")} ครั้ง
        </p>
      </div>
      <div className="flex shrink-0">
        <Link
          href={`/dashboards/${dashboard.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: palette.ink, outlineColor: palette.accent }}
        >
          เปิด
          <span aria-hidden="true">→</span>
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
  href,
}: {
  title: string;
  description: string;
  dashboards: Dashboard[];
  emptyText: string;
  href?: string;
}) {
  return (
    <section
      className="rounded-xl p-4"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold" style={{ color: palette.ink }}>
            {title}
            <span
              className="ml-2 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums"
              style={{ background: palette.muted, color: palette.inkMuted }}
            >
              {dashboards.length}
            </span>
          </h2>
          <p className="mt-1 text-sm leading-6" style={{ color: palette.inkMuted }}>
            {description}
          </p>
        </div>
        {href ? (
          <Link
            href={href}
            className="text-sm font-semibold underline-offset-4 hover:underline"
            style={{ color: palette.accentDeep }}
          >
            ดูทั้งหมด →
          </Link>
        ) : null}
      </header>

      {dashboards.length ? (
        <div className="mt-3 grid gap-2">
          {dashboards.slice(0, 4).map((dashboard) => (
            <ReportRow key={dashboard.id} dashboard={dashboard} />
          ))}
        </div>
      ) : (
        <p
          className="mt-3 rounded-lg border border-dashed px-4 py-6 text-center text-sm"
          style={{ borderColor: palette.border, color: palette.inkMuted, background: palette.base }}
        >
          {emptyText}
        </p>
      )}
    </section>
  );
}

function CategoryRail({ categories }: { categories: Category[] }) {
  const visibleCategories = categories.slice(0, 8);

  return (
    <section
      className="rounded-xl p-4"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: palette.ink }}>
            หมวดรายงาน
          </h2>
          <p className="mt-1 text-sm leading-6" style={{ color: palette.inkMuted }}>
            โครงสร้างหมวดหมู่หลายระดับตามกลุ่มงาน
          </p>
        </div>
        <Link
          href="/catalog"
          className="text-sm font-semibold underline-offset-4 hover:underline"
          style={{ color: palette.accentDeep }}
        >
          ดูทั้งหมด →
        </Link>
      </header>
      <ul className="mt-3 space-y-0.5">
        {visibleCategories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/catalog?category=${category.id}`}
              className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors duration-150 hover:bg-[oklch(0.955_0.005_250)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={{
                color: palette.ink,
                fontWeight: 500,
                outlineColor: palette.accent,
                paddingLeft: 12 + Math.min(category.depth ?? 0, 3) * 14,
              }}
            >
              <span className="min-w-0 truncate">{category.name}</span>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums"
                style={{ background: palette.muted, color: palette.inkMuted }}
              >
                {category.dashboardCount.toLocaleString("th-TH")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getHeroCopy(mode: HomeMode) {
  if (mode === "viewer") {
    return {
      eyebrow: "หน้าหลัก · ผู้ใช้",
      title: "รายงานที่คุณเข้าถึงได้",
      description: "เปิดดูรายงานสาธารณะและรายงานภายในที่อนุญาตตามสิทธิ์ของบัญชีคุณ",
    };
  }

  if (mode === "creator") {
    return {
      eyebrow: "หน้าหลัก · ผู้จัดทำ",
      title: "จัดการรายงานของหน่วยงาน",
      description: "ติดตามร่าง รายงานที่ต้องปรับปรุง และรายงานที่เผยแพร่แล้วของทีมคุณ",
    };
  }

  if (mode === "reviewer") {
    return {
      eyebrow: "หน้าหลัก · ผู้ตรวจสอบ",
      title: "ดูแลรายงานและหมวดข้อมูล",
      description: "ติดตามความพร้อมของรายงาน หมวดข้อมูล และข้อจำกัดของ dashboard embed",
    };
  }

  return {
    eyebrow: "หน้าหลัก · ผู้ดูแลระบบ",
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
    <main
      className="min-h-screen"
      style={{ background: palette.base, color: palette.ink }}
    >
      <header
        className="border-b"
        style={{ background: palette.paper, borderColor: palette.border }}
      >
        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: palette.accent }}
                  aria-hidden="true"
                />
                <p
                  className="text-[13px] font-semibold tracking-wide"
                  style={{ color: palette.accentDeep }}
                >
                  {heroCopy.eyebrow}
                </p>
              </div>
              <h1
                className="mt-1.5 text-[30px] font-semibold leading-tight tracking-tight md:text-[34px]"
                style={{ color: palette.ink }}
              >
                {heroCopy.title}
              </h1>
              <p
                className="mt-2 max-w-3xl text-[15px] leading-7"
                style={{ color: palette.inkMuted }}
              >
                {heroCopy.description}
              </p>
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

            <aside
              className="rounded-xl p-4"
              style={{ background: palette.base, border: `1px solid ${palette.border}` }}
            >
              <p
                className="text-[13px] font-semibold tracking-wide"
                style={{ color: palette.inkMuted }}
              >
                เข้าสู่ระบบในชื่อ
              </p>
              <h2
                className="mt-1 text-lg font-semibold leading-tight"
                style={{ color: palette.ink }}
              >
                {currentUser.name}
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: palette.inkMuted }}>
                {currentUser.title} · {currentUser.department}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {currentUser.roles.map((role) => (
                  <RolePill key={role} role={role} />
                ))}
              </div>
            </aside>
          </div>

          <section
            className="mt-6 grid gap-px overflow-hidden rounded-xl border"
            style={{ background: palette.border, borderColor: palette.border }}
          >
            <div className="grid gap-px md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <div
                className="relative px-5 py-4"
                style={{ background: palette.accentSoft }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: palette.accentDeep }}
                >
                  รายงานที่เปิดได้
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <strong
                    className="text-[34px] font-semibold leading-none tracking-tight"
                    style={{ color: palette.accentDeep }}
                  >
                    {publishedReports.length.toLocaleString("th-TH")}
                  </strong>
                  <span
                    className="text-sm"
                    style={{ color: palette.accentDeep, opacity: 0.7 }}
                  >
                    / {publishedReports.length.toLocaleString("th-TH")} รายการที่เปิดได้
                  </span>
                </div>
                <p
                  className="mt-2 text-xs"
                  style={{ color: palette.accentDeep, opacity: 0.65 }}
                >
                  ทุกรายงานที่บัญชีนี้เข้าถึงได้
                </p>
              </div>
              <KpiCell
                label="รายงานสาธารณะ"
                value={publicReports.length}
                accent={palette.emerald}
                detail="ประชาชนเห็นได้"
              />
              <KpiCell
                label="ต้องเข้าสู่ระบบ"
                value={loginRequiredReports.length}
                accent={palette.indigo}
                detail="รายงานภายใน"
              />
              <KpiCell
                label={canAudit ? "หมวดรายงาน" : "ทีมของฉัน"}
                value={canAudit ? categories.length : myTeamReports.length}
                accent={palette.amber}
                detail={canAudit ? "ทุกระดับชั้น" : "รายงานที่เกี่ยวข้อง"}
              />
            </div>
          </section>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          {mode === "viewer" ? (
            <>
              <ReportList
                title="รายงานแนะนำ"
                description="รายงานที่เผยแพร่แล้วและเหมาะกับการเปิดดูบ่อย"
                dashboards={recommendedReports}
                emptyText="ยังไม่มีรายงานแนะนำในขณะนี้"
                href="/catalog"
              />
              <ReportList
                title="อัปเดตล่าสุด"
                description="รายงานที่มีการปรับปรุงล่าสุดตามสิทธิ์ของคุณ"
                dashboards={publishedReports}
                emptyText="ยังไม่มีรายงานที่เปิดให้บัญชีนี้ดู"
                href="/catalog?sort=updated_desc"
              />
            </>
          ) : (
            <>
              <ReportList
                title="งานของฉันและทีม"
                description="ร่าง รายงานตีกลับ และรายการที่ทีมของคุณกำลังจัดการ"
                dashboards={myWorkingReports}
                emptyText="ไม่มีงานค้างของทีมในขณะนี้"
                href="/catalog?status=draft"
              />
              <ReportList
                title="รายงานเผยแพร่ล่าสุด"
                description="รายงานที่พร้อมเปิดดูจากระบบหลัง login"
                dashboards={publishedReports}
                emptyText="ยังไม่มีรายงานเผยแพร่"
                href="/catalog?status=published"
              />
            </>
          )}
        </div>

        <div className="space-y-5">
          <CategoryRail categories={categories} />
          {canManageUsers ? (
            <section
              className="rounded-xl p-4"
              style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
            >
              <h2 className="text-base font-semibold" style={{ color: palette.ink }}>
                ดูแลระบบ
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: palette.inkMuted }}>
                จัดการสิทธิ์ผู้ใช้ หมวดรายงาน และตรวจสอบประวัติการเปลี่ยนแปลง
              </p>
              <div className="mt-3 grid gap-2">
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
