import {
  externalOnlyDashboards,
  favoriteDashboards,
  mockCategories,
  mockCurrentUser,
  myTeamDashboards,
  pendingReviewDashboards,
  pinnedDashboards,
  popularDashboards,
  recentlyPublishedDashboards,
} from "@/lib/mock-portal-data";
import type {
  Category,
  Dashboard,
  DashboardProvider,
  DashboardStatus,
  SensitivityLevel,
} from "@/lib/portal-types";
import Link from "next/link";

const providerStyles: Record<DashboardProvider, string> = {
  "Looker Studio": "border-sky-200 bg-sky-50 text-sky-800",
  Superset: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Grafana: "border-amber-200 bg-amber-50 text-amber-800",
  Metabase: "border-cyan-200 bg-cyan-50 text-cyan-800",
  "Power BI": "border-yellow-200 bg-yellow-50 text-yellow-900",
  Custom: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

const statusLabels: Record<DashboardStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
};

const sensitivityLabels: Record<SensitivityLevel, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  restricted: "Restricted",
};

function MetricCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href?: string;
}) {
  const content = (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <strong className="text-3xl font-semibold text-zinc-950">{value}</strong>
        <span className="text-right text-sm text-zinc-500">{detail}</span>
      </div>
    </section>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}

function DashboardCard({ dashboard, compact = false }: { dashboard: Dashboard; compact?: boolean }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-md border px-2 py-1 text-xs font-medium ${providerStyles[dashboard.provider]}`}
            >
              {dashboard.provider}
            </span>
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600">
              {statusLabels[dashboard.status]}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold leading-6 text-zinc-950">
            {dashboard.title}
          </h3>
        </div>
        {dashboard.isPinned ? (
          <span className="rounded-md bg-zinc-950 px-2 py-1 text-xs font-medium text-white">
            Pinned
          </span>
        ) : null}
      </div>
      {!compact ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{dashboard.description}</p>
      ) : null}
      <div className="mt-4 space-y-2 text-sm text-zinc-600">
        <div className="flex items-center justify-between gap-4">
          <span className="truncate">{dashboard.categoryName}</span>
          <span className="shrink-0 font-medium text-zinc-800">
            {dashboard.views.toLocaleString()} views
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="truncate">{dashboard.owner}</span>
          <span className="shrink-0">{dashboard.updatedAt}</span>
        </div>
      </div>
      {!compact ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {dashboard.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
              {tag}
            </span>
          ))}
          <span className="rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {sensitivityLabels[dashboard.sensitivity]}
          </span>
        </div>
      ) : null}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/dashboards/${dashboard.id}`}
          className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Open
        </Link>
        <a
          href={dashboard.externalUrl}
          className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          target="_blank"
          rel="noreferrer"
        >
          Fallback
        </a>
      </div>
    </article>
  );
}

function QuickAction({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </Link>
  );
}

function CategoryNode({ category }: { category: Category }) {
  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-zinc-900">{category.name}</span>
        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
          {category.dashboardCount}
        </span>
      </div>
      {category.children?.length ? (
        <ul className="mt-3 space-y-2 border-l border-zinc-200 pl-3">
          {category.children.map((child) => (
            <CategoryNode key={child.id} category={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function DashboardSection({
  title,
  description,
  dashboards,
  compact = false,
}: {
  title: string;
  description: string;
  dashboards: Dashboard[];
  compact?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
        <span className="text-sm font-medium text-zinc-500">{dashboards.length} items</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {dashboards.map((dashboard) => (
          <DashboardCard key={dashboard.id} dashboard={dashboard} compact={compact} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const publishedCount = recentlyPublishedDashboards.length;

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white px-5 py-6 lg:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Governed Portal
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-8">Dashboard Hub</h1>
          </div>
          <nav className="mt-8 space-y-1 text-sm font-medium">
            {[
              { label: "หน้าหลัก", href: "/" },
              { label: "Catalog", href: "/catalog" },
              { label: "หมวดหมู่", href: "#" },
              { label: "คิวตรวจสอบ", href: "/review" },
              { label: "ประวัติ Audit", href: "/audit" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-md px-3 py-2 ${
                  item.href === "/"
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">โครงสร้างหมวดหมู่</h2>
              <button className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700">
                Add
              </button>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {mockCategories.map((category) => (
                <CategoryNode key={category.id} category={category} />
              ))}
            </ul>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-zinc-200 bg-white">
            <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-sm font-medium text-zinc-500">ผู้ใช้จำลองจาก SSO</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
                  {mockCurrentUser.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {mockCurrentUser.title} · {mockCurrentUser.department}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {mockCurrentUser.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div className="space-y-8 px-5 py-6 lg:px-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Dashboard ที่เผยแพร่"
                value={String(publishedCount)}
                detail="เห็นได้ล่าสุด"
                href="/catalog"
              />
              <MetricCard
                label="รอตรวจสอบ"
                value={String(pendingReviewDashboards.length)}
                detail="ต้องดำเนินการ"
                href="/review"
              />
              <MetricCard
                label="ปักหมุดโดย Admin"
                value={String(pinnedDashboards.length)}
                detail="หน้าแรก"
                href="/catalog"
              />
              <MetricCard
                label="เปิดภายนอกเท่านั้น"
                value={String(externalOnlyDashboards.length)}
                detail="ต้องใช้ fallback"
                href="/catalog"
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <QuickAction
                title="เปิด Catalog"
                description="ดู Dashboard ทั้งหมด พร้อมสถานะ ความอ่อนไหว และ Embed health"
                href="/catalog"
              />
              <QuickAction
                title="คิวตรวจสอบ"
                description="อนุมัติหรือปฏิเสธ Dashboard ที่รอการตรวจสอบ"
                href="/review"
              />
              <QuickAction
                title="ประวัติ Audit"
                description="ตรวจสอบประวัติการเปลี่ยนแปลง Dashboard และหมวดหมู่"
                href="/audit"
              />
              <QuickAction
                title="สร้าง Dashboard"
                description="เพิ่ม metadata, Provider URL, fallback URL, tag และตรวจ Embed health"
                href="/dashboards/new"
              />
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                <label className="block">
                  <span className="sr-only">ค้นหา Dashboard</span>
                  <input
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500"
                    placeholder="ค้นหาด้วยชื่อ Dashboard, tag, เจ้าของ, provider..."
                  />
                </label>
                <select className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-zinc-500">
                  <option>ทุก Provider</option>
                  <option>Looker Studio</option>
                  <option>Superset</option>
                  <option>Grafana</option>
                </select>
                <Link
                  href="/dashboards/new"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  สร้าง Dashboard
                </Link>
              </div>
            </section>

            <DashboardSection
              title="ปักหมุดโดยผู้บริหาร"
              description="Dashboard สำคัญที่ถูกดันขึ้นหน้าแรกโดย admin หรือผู้บริหาร"
              dashboards={pinnedDashboards}
            />

            <div className="grid gap-8 xl:grid-cols-2">
              <DashboardSection
                title="รอตรวจสอบ"
                description="รายการที่รอ approve/reject ก่อนเผยแพร่"
                dashboards={pendingReviewDashboards}
                compact
              />
              <DashboardSection
                title="เผยแพร่ล่าสุด"
                description="dashboard published ล่าสุดที่ผู้ใช้มองเห็นได้"
                dashboards={recentlyPublishedDashboards}
                compact
              />
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <DashboardSection
                title="ควรตรวจ Embed"
                description="Dashboard ที่ควรใช้ fallback เพราะ iframe อาจถูกบล็อก"
                dashboards={externalOnlyDashboards}
                compact
              />
              <DashboardSection
                title="ยอดนิยม"
                description="เรียงจากจำนวนการเปิดดูใน portal"
                dashboards={popularDashboards}
                compact
              />
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <DashboardSection
                title="ทีมของฉัน"
                description="dashboard ที่ทีมของผู้ใช้ mock SSO เป็นเจ้าของ"
                dashboards={myTeamDashboards}
                compact
              />
              <DashboardSection
                title="รายการโปรด"
                description="รายการที่ผู้ใช้ติดดาวไว้เพื่อกลับมาเปิดเร็ว"
                dashboards={favoriteDashboards}
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
