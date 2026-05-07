import { buttonStyles, fieldStyles, focusRing } from "@/components/dashboard-ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listCategories } from "@/lib/db/categories";
import { listDashboards } from "@/lib/db/dashboards";
import type {
  Category,
  Dashboard,
  DashboardProvider,
  DashboardStatus,
  EmbedStatus,
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
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
};

const sensitivityStyles: Record<SensitivityLevel, string> = {
  public: "bg-teal-50 text-teal-800",
  internal: "bg-sky-50 text-sky-800",
  confidential: "bg-orange-50 text-orange-800",
  restricted: "bg-rose-50 text-rose-800",
};

const sensitivityLabels: Record<SensitivityLevel, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  restricted: "Restricted",
};

const embedStyles: Record<EmbedStatus, string> = {
  embeddable: "bg-emerald-50 text-emerald-800",
  unknown: "bg-amber-50 text-amber-900",
  external_only: "bg-rose-50 text-rose-800",
  blocked: "bg-rose-100 text-rose-900",
};

const embedLabels: Record<EmbedStatus, string> = {
  embeddable: "Embed OK",
  unknown: "Need check",
  external_only: "Fallback",
  blocked: "Blocked",
};

const navItems = [
  { label: "หน้าหลัก", href: "/", count: null },
  { label: "Catalog", href: "/catalog", count: null },
  { label: "คิวตรวจสอบ", href: "/review", count: null },
  { label: "ประวัติ Audit", href: "/audit", count: null },
  { label: "สร้าง Dashboard", href: "/dashboards/new", count: null },
];

function uniqueDashboards(dashboards: Dashboard[]) {
  return dashboards.filter(
    (dashboard, index, list) =>
      list.findIndex((candidate) => candidate.id === dashboard.id) === index,
  );
}

function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function WorkMetric({
  label,
  value,
  detail,
  tone,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "review" | "risk" | "ok" | "info";
  href: string;
}) {
  const toneClasses = {
    review: "bg-slate-100 text-slate-950 ring-slate-200",
    risk: "bg-slate-100 text-slate-950 ring-slate-200",
    ok: "bg-slate-100 text-slate-950 ring-slate-200",
    info: "bg-slate-100 text-slate-950 ring-slate-200",
  };

  return (
    <Link
      href={href}
      className={`group rounded-lg p-4 ring-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${toneClasses[tone]}`}
    >
      <span className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</span>
      <span className="mt-3 flex items-end justify-between gap-4">
        <strong className="text-3xl font-semibold tracking-tight">{value}</strong>
        <span className="max-w-28 text-right text-sm leading-5 opacity-75">{detail}</span>
      </span>
    </Link>
  );
}

function CategoryNode({ category, level = 0 }: { category: Category; level?: number }) {
  return (
    <li>
      <div
        className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
          level === 0 ? "bg-slate-100 text-slate-900" : "bg-slate-50 text-slate-700"
        }`}
      >
        <span className="min-w-0 truncate font-medium">{category.name}</span>
        <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {category.dashboardCount}
        </span>
      </div>
      {category.children?.length ? (
        <ul className="mt-2 space-y-2 pl-3">
          {category.children.map((child) => (
            <CategoryNode key={child.id} category={child} level={level + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function FeaturedDashboard({ dashboard }: { dashboard: Dashboard }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.6)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={providerStyles[dashboard.provider]}>{dashboard.provider}</Badge>
        <Badge className={statusStyles[dashboard.status]}>{statusLabels[dashboard.status]}</Badge>
        <Badge className={embedStyles[dashboard.embedStatus]}>{embedLabels[dashboard.embedStatus]}</Badge>
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{dashboard.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{dashboard.description}</p>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</dt>
          <dd className="mt-1 truncate font-medium text-slate-800">{dashboard.owner}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Views</dt>
          <dd className="mt-1 font-medium text-slate-800">{dashboard.views.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
          <dd className="mt-1 font-medium text-slate-800">{dashboard.updatedAt}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`/dashboards/${dashboard.id}`}
          className={`${buttonStyles.primary} h-10 justify-center`}
        >
          Open dashboard
        </Link>
        <a
          href={dashboard.externalUrl}
          className={`${buttonStyles.secondary} h-10 justify-center`}
          target="_blank"
          rel="noreferrer"
        >
          Fallback URL
        </a>
      </div>
    </article>
  );
}

function QueueRow({ dashboard }: { dashboard: Dashboard }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition duration-200 hover:border-slate-300 hover:bg-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={providerStyles[dashboard.provider]}>{dashboard.provider}</Badge>
            <Badge className={sensitivityStyles[dashboard.sensitivity]}>
              {sensitivityLabels[dashboard.sensitivity]}
            </Badge>
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-slate-950">{dashboard.title}</h3>
          <p className="mt-1 truncate text-sm text-slate-500">{dashboard.owner}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <span className="text-slate-500">{dashboard.updatedAt}</span>
          <Link
            href={`/dashboards/${dashboard.id}`}
            className={`${buttonStyles.secondary} h-9 px-3`}
          >
            Review
          </Link>
        </div>
      </div>
    </li>
  );
}

function CompactDashboardList({
  title,
  description,
  dashboards,
  actionLabel,
}: {
  title: string;
  description: string;
  dashboards: Dashboard[];
  actionLabel: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
          {dashboards.length}
        </span>
      </div>
      <ul className="divide-y divide-slate-200">
        {dashboards.map((dashboard) => (
          <li key={dashboard.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  <h3 className="truncate text-sm font-semibold text-slate-900">{dashboard.title}</h3>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {dashboard.provider} · {dashboard.categoryName}
                </p>
              </div>
              <Link
                href={`/dashboards/${dashboard.id}`}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition duration-200 hover:bg-slate-100 ${focusRing}`}
              >
                {actionLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RiskPanel({ dashboards }: { dashboards: Dashboard[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Embed risk lane</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Dashboard ที่ควรเปิดผ่าน fallback หรือเช็ค iframe policy ก่อนเผยแพร่
          </p>
        </div>
        <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
          {dashboards.length}
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {dashboards.map((dashboard) => (
          <li key={dashboard.id} className="rounded-md bg-slate-50 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-950">{dashboard.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {dashboard.embedStatusReason}
                </p>
              </div>
              <Badge className={embedStyles[dashboard.embedStatus]}>{embedLabels[dashboard.embedStatus]}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Home() {
  const currentUser = await getCurrentUser();
  const [categories, dashboards] = await Promise.all([
    listCategories(),
    listDashboards(currentUser.id),
  ]);
  const pinnedDashboards = dashboards.filter((dashboard) => dashboard.isPinned);
  const pendingReviewDashboards = dashboards.filter((dashboard) => dashboard.status === "in_review");
  const externalOnlyDashboards = dashboards.filter(
    (dashboard) => dashboard.embedStatus === "external_only" || dashboard.embedStatus === "blocked",
  );
  const recentlyPublishedDashboards = [...dashboards]
    .filter((dashboard) => dashboard.status === "published")
    .sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
    )
    .slice(0, 4);
  const popularDashboards = [...dashboards]
    .sort((first, second) => second.views - first.views)
    .slice(0, 4);
  const myTeamDashboards = dashboards.filter(
    (dashboard) => dashboard.ownerTeamId === currentUser.teamId,
  );
  const favoriteDashboards = dashboards.filter((dashboard) => dashboard.isFavorite);
  const publishedCount = recentlyPublishedDashboards.length;
  const mainPinnedDashboard = pinnedDashboards[0] ?? recentlyPublishedDashboards[0];
  const secondaryPinnedDashboards = pinnedDashboards.slice(1);
  const operationalDashboards = uniqueDashboards([
    ...pendingReviewDashboards,
    ...externalOnlyDashboards,
  ]).slice(0, 4);

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-slate-50 px-5 py-6 lg:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Governed Portal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Dashboard Hub
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              ค้นหา เปิด ตรวจสอบ และกำกับ dashboard จากหลาย provider ในที่เดียว
            </p>
          </div>

          <nav className="mt-8 space-y-1 text-sm font-semibold">
            {navItems.map((item) => {
              const count =
                item.href === "/catalog"
                  ? dashboards.length
                  : item.href === "/review"
                    ? pendingReviewDashboards.length
                    : item.count;

              return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${
                  item.href === "/"
                    ? "bg-slate-950 text-slate-50 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span>{item.label}</span>
                {count !== null ? (
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      item.href === "/" ? "bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
              );
            })}
          </nav>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">โครงสร้างหมวดหมู่</h2>
              <Link
                href="/catalog"
                className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-950"
              >
                View
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {categories.map((category) => (
                <CategoryNode key={category.id} category={category} />
              ))}
            </ul>
          </section>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-slate-50/95">
            <div className="px-5 py-5 lg:px-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold text-slate-500">ผู้ใช้จำลองจาก SSO</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                    {currentUser.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {currentUser.title} · {currentUser.department}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentUser.roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <WorkMetric
                  label="Published"
                  value={String(publishedCount)}
                  detail="เห็นล่าสุดใน portal"
                  href="/catalog"
                  tone="ok"
                />
                <WorkMetric
                  label="Review queue"
                  value={String(pendingReviewDashboards.length)}
                  detail="ต้องตัดสินใจ"
                  href="/review"
                  tone="review"
                />
                <WorkMetric
                  label="Pinned"
                  value={String(pinnedDashboards.length)}
                  detail="หน้าแรก"
                  href="/catalog"
                  tone="info"
                />
                <WorkMetric
                  label="Embed risk"
                  value={String(externalOnlyDashboards.length)}
                  detail="ใช้ fallback"
                  href="/catalog"
                  tone="risk"
                />
              </section>
            </div>
          </header>

          <div className="space-y-7 px-5 py-6 lg:px-8">
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[1fr_170px_170px_auto]">
                <label className="block">
                  <span className="sr-only">ค้นหา Dashboard</span>
                  <input
                    className={`${fieldStyles} h-11 w-full`}
                    placeholder="ค้นหาด้วยชื่อ Dashboard, tag, เจ้าของ, provider..."
                  />
                </label>
                <select className={`${fieldStyles} h-11 text-slate-700`}>
                  <option>ทุก Provider</option>
                  <option>Looker Studio</option>
                  <option>Superset</option>
                  <option>Grafana</option>
                </select>
                <select className={`${fieldStyles} h-11 text-slate-700`}>
                  <option>ทุกสถานะ</option>
                  <option>Published</option>
                  <option>In review</option>
                  <option>Embed risk</option>
                </select>
                <Link
                  href="/dashboards/new"
                  className={`${buttonStyles.primary} h-11 justify-center`}
                >
                  สร้าง Dashboard
                </Link>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
              {mainPinnedDashboard ? <FeaturedDashboard dashboard={mainPinnedDashboard} /> : null}
              <div className="grid gap-4">
                <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">งานที่ควรจัดการก่อน</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        รายการที่รอ review หรือมีความเสี่ยงจาก embed policy
                      </p>
                    </div>
                    <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                      {operationalDashboards.length}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {operationalDashboards.map((dashboard) => (
                      <QueueRow key={dashboard.id} dashboard={dashboard} />
                    ))}
                  </ul>
                </section>
                <RiskPanel dashboards={externalOnlyDashboards} />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              <CompactDashboardList
                title="เผยแพร่ล่าสุด"
                description="dashboard published ล่าสุดที่ผู้ใช้มองเห็นได้"
                dashboards={recentlyPublishedDashboards}
                actionLabel="Open"
              />
              <CompactDashboardList
                title="ยอดนิยม"
                description="เรียงจากจำนวนการเปิดดูใน portal"
                dashboards={popularDashboards}
                actionLabel="Open"
              />
              <CompactDashboardList
                title="ทีมของฉัน"
                description="dashboard ที่ทีมของผู้ใช้ mock SSO เป็นเจ้าของ"
                dashboards={myTeamDashboards.length ? myTeamDashboards : secondaryPinnedDashboards}
                actionLabel="View"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <CompactDashboardList
                title="รายการโปรด"
                description="รายการที่ผู้ใช้ติดดาวไว้เพื่อกลับมาเปิดเร็ว"
                dashboards={favoriteDashboards}
                actionLabel="Open"
              />
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-base font-semibold text-slate-950">Governance snapshot</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Visible dashboards</dt>
                    <dd className="font-semibold text-slate-900">{dashboards.length}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Categories</dt>
                    <dd className="font-semibold text-slate-900">{categories.length}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Review workload</dt>
                    <dd className="font-semibold text-amber-900">{pendingReviewDashboards.length}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500">Fallback required</dt>
                    <dd className="font-semibold text-rose-800">{externalOnlyDashboards.length}</dd>
                  </div>
                </dl>
              </section>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
