import Link from "next/link";
import { CategoryRail } from "./category-rail";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listCategories } from "@/lib/db/categories";
import { listDashboardsForUser } from "@/lib/db/dashboards";
import {
  canUpdateDashboard,
  hasPermission,
} from "@/lib/permissions";
import type {
  Category,
  Dashboard,
  DashboardProvider,
  DashboardStatus,
  EmbedStatus,
  PortalUser,
  SensitivityLevel,
} from "@/lib/portal-types";

export const dynamic = "force-dynamic";

const palette = {
  base: "oklch(0.985 0.003 250)",
  paper: "oklch(0.998 0.002 250)",
  muted: "oklch(0.955 0.005 250)",
  border: "oklch(0.91 0.006 250)",
  borderStrong: "oklch(0.85 0.008 250)",
  ink: "oklch(0.21 0.015 255)",
  inkMuted: "oklch(0.5 0.012 255)",
  inkFaint: "oklch(0.66 0.01 255)",
  accent: "oklch(0.5 0.14 258)",
  accentDeep: "oklch(0.4 0.13 260)",
  accentSoft: "oklch(0.95 0.028 258)",
  accentTint: "oklch(0.978 0.012 258)",
  amber: "oklch(0.65 0.12 75)",
  amberSoft: "oklch(0.96 0.035 80)",
  rose: "oklch(0.58 0.15 25)",
  roseSoft: "oklch(0.96 0.03 25)",
  emerald: "oklch(0.55 0.11 165)",
  emeraldSoft: "oklch(0.96 0.025 165)",
  indigo: "oklch(0.48 0.12 270)",
  indigoSoft: "oklch(0.96 0.025 270)",
} as const;

const statusStyle: Record<DashboardStatus, { bg: string; ink: string; dot: string; label: string }> = {
  draft: { bg: palette.muted, ink: palette.inkMuted, dot: palette.inkFaint, label: "ร่าง" },
  in_review: { bg: palette.amberSoft, ink: "oklch(0.42 0.1 75)", dot: palette.amber, label: "รอตรวจ" },
  published: { bg: palette.emeraldSoft, ink: "oklch(0.36 0.09 155)", dot: palette.emerald, label: "เผยแพร่" },
  rejected: { bg: palette.roseSoft, ink: "oklch(0.42 0.13 25)", dot: palette.rose, label: "ตีกลับ" },
  archived: { bg: palette.muted, ink: palette.inkFaint, dot: palette.inkFaint, label: "เก็บถาวร" },
};

const sensitivityStyle: Record<SensitivityLevel, { bg: string; ink: string; label: string }> = {
  public: { bg: palette.emeraldSoft, ink: "oklch(0.4 0.1 165)", label: "สาธารณะ" },
  internal: { bg: palette.indigoSoft, ink: palette.indigo, label: "ต้องเข้าสู่ระบบ" },
  confidential: { bg: palette.amberSoft, ink: "oklch(0.4 0.11 75)", label: "ภายในหน่วยงาน" },
  restricted: { bg: palette.roseSoft, ink: "oklch(0.42 0.14 25)", label: "จำกัดสิทธิ์" },
};

const embedStyle: Record<EmbedStatus, { bg: string; ink: string; label: string }> = {
  embeddable: { bg: palette.emeraldSoft, ink: "oklch(0.4 0.1 165)", label: "ฝังได้" },
  unknown: { bg: palette.muted, ink: palette.inkMuted, label: "รอตรวจ" },
  external_only: { bg: palette.indigoSoft, ink: palette.indigo, label: "เปิดภายนอก" },
  blocked: { bg: palette.roseSoft, ink: "oklch(0.42 0.14 25)", label: "ถูกบล็อก" },
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
const accessFilters = ["public", "login_required", "restricted"] as const;
const sortOptions = ["updated_desc", "updated_asc", "views_desc", "title_asc"] as const;

type AccessFilter = (typeof accessFilters)[number];

type CatalogSearchParams = {
  q?: string;
  category?: string;
  provider?: string;
  status?: string;
  access?: string;
  sort?: string;
};

type FlatCategory = {
  id: string;
  name: string;
  depth: number;
  path: string[];
  descendantIds: string[];
  dashboardCount: number;
};

function isProvider(value: string): value is DashboardProvider {
  return providers.includes(value as DashboardProvider);
}

function isStatus(value: string): value is DashboardStatus {
  return statuses.includes(value as DashboardStatus);
}

function isAccessFilter(value: string): value is AccessFilter {
  return accessFilters.includes(value as AccessFilter);
}

function flattenCategories(categories: Category[], depth = 0, parentPath: string[] = []): FlatCategory[] {
  return categories.flatMap((category) => {
    const path = [...parentPath, category.name];
    const children = flattenCategories(category.children ?? [], depth + 1, path);

    return [
      {
        id: category.id,
        name: category.name,
        depth,
        path,
        dashboardCount: category.dashboardCount,
        descendantIds: [category.id, ...children.flatMap((child) => child.descendantIds)],
      },
      ...children,
    ];
  });
}

function normalizeSearchParams(searchParams: CatalogSearchParams, categories: FlatCategory[]) {
  const categoryIds = new Set(categories.map((category) => category.id));
  const access: "all" | AccessFilter =
    searchParams.access && isAccessFilter(searchParams.access) ? searchParams.access : "all";

  return {
    q: searchParams.q?.trim() ?? "",
    category: searchParams.category && categoryIds.has(searchParams.category) ? searchParams.category : "all",
    provider: searchParams.provider && isProvider(searchParams.provider) ? searchParams.provider : "all",
    status: searchParams.status && isStatus(searchParams.status) ? searchParams.status : "all",
    access,
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
    dashboard.categoryPath?.join(" "),
    dashboard.status,
    dashboard.sensitivity,
    ...dashboard.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("th-TH");

  return searchable.includes(query.toLocaleLowerCase("th-TH"));
}

function dashboardMatchesAccess(dashboard: Dashboard, access: "all" | AccessFilter): boolean {
  if (access === "all") {
    return true;
  }

  if (access === "public") {
    return dashboard.sensitivity === "public";
  }

  if (access === "login_required") {
    return dashboard.sensitivity === "internal" || dashboard.sensitivity === "confidential";
  }

  return dashboard.sensitivity === "restricted";
}

function filterDashboards(
  dashboards: Dashboard[],
  categories: FlatCategory[],
  filters: ReturnType<typeof normalizeSearchParams>,
) {
  const selectedCategory = categories.find((category) => category.id === filters.category);
  const categoryIds = selectedCategory ? new Set(selectedCategory.descendantIds) : null;

  return dashboards
    .filter((dashboard) => dashboardMatchesQuery(dashboard, filters.q))
    .filter((dashboard) => !categoryIds || categoryIds.has(dashboard.categoryId))
    .filter((dashboard) => filters.provider === "all" || dashboard.provider === filters.provider)
    .filter((dashboard) => filters.status === "all" || dashboard.status === filters.status)
    .filter((dashboard) => dashboardMatchesAccess(dashboard, filters.access))
    .sort((first, second) => {
      if (filters.sort === "updated_asc") {
        return Date.parse(first.updatedAt) - Date.parse(second.updatedAt);
      }
      if (filters.sort === "views_desc") {
        return second.views - first.views;
      }
      if (filters.sort === "title_asc") {
        return first.title.localeCompare(second.title, "th-TH");
      }
      return Date.parse(second.updatedAt) - Date.parse(first.updatedAt);
    });
}

function ReportRow({ currentUser, dashboard }: { currentUser: PortalUser; dashboard: Dashboard }) {
  const canUpdate = canUpdateDashboard(currentUser, dashboard);
  const status = statusStyle[dashboard.status];
  const sensitivity = sensitivityStyle[dashboard.sensitivity];
  const embed = embedStyle[dashboard.embedStatus];
  const categoryPath = dashboard.categoryPath?.length
    ? dashboard.categoryPath.join(" / ")
    : dashboard.categoryName;

  return (
    <article
      className="group flex flex-col gap-4 overflow-hidden rounded-xl px-5 py-4 transition-shadow duration-200 hover:shadow-[0_2px_12px_-4px_oklch(0.3_0.02_255/0.12)] lg:flex-row lg:items-start lg:justify-between"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
          <span className="inline-flex items-center gap-1.5" style={{ color: status.ink }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: status.dot }}
              aria-hidden="true"
            />
            <span className="font-semibold">{status.label}</span>
          </span>
          <span style={{ color: palette.inkFaint }} aria-hidden="true">·</span>
          <span style={{ color: sensitivity.ink }} className="font-medium">
            {sensitivity.label}
          </span>
          <span style={{ color: palette.inkFaint }} aria-hidden="true">·</span>
          <span style={{ color: embed.ink }} className="font-medium">
            {embed.label}
          </span>
        </div>
        <h2 className="mt-2 text-[17px] font-semibold leading-6" style={{ color: palette.ink }}>
          {dashboard.title}
        </h2>
          <p className="mt-1.5 line-clamp-2 text-sm leading-6" style={{ color: palette.inkMuted }}>
            {dashboard.description}
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px]">
            <div className="flex items-baseline gap-1.5">
              <dt style={{ color: palette.inkFaint }}>หมวด</dt>
              <dd className="font-medium" style={{ color: palette.ink }}>{categoryPath}</dd>
            </div>
            <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
            <div className="flex items-baseline gap-1.5">
              <dt style={{ color: palette.inkFaint }}>เจ้าของ</dt>
              <dd className="font-medium" style={{ color: palette.ink }}>{dashboard.owner}</dd>
            </div>
            <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
            <div className="flex items-baseline gap-1.5">
              <dt style={{ color: palette.inkFaint }}>{dashboard.provider}</dt>
            </div>
            <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
            <div className="flex items-baseline gap-1.5">
              <dt style={{ color: palette.inkFaint }}>{dashboard.updatedAt}</dt>
              <dd style={{ color: palette.inkFaint }}>· {dashboard.views.toLocaleString("th-TH")} ครั้ง</dd>
            </div>
          </dl>

          {dashboard.tags.length ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {dashboard.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                  style={{ background: palette.muted, color: palette.inkMuted }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end lg:self-start">
          {canUpdate ? (
            <Link
              href={`/dashboards/${dashboard.id}/edit`}
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold transition-colors duration-150 hover:bg-[oklch(0.94_0.005_250)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: palette.inkMuted,
                outlineColor: palette.accent,
              }}
            >
              แก้ไข
            </Link>
          ) : null}
        <Link
          href={`/dashboards/${dashboard.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: palette.ink, outlineColor: palette.accent }}
        >
          เปิดรายงาน
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const currentUser = await requireCurrentUser();
  const [categoryTree, allDashboards] = await Promise.all([
    listCategories(),
    listDashboardsForUser(currentUser),
  ]);
  const categories = flattenCategories(categoryTree);
  const filters = normalizeSearchParams(await searchParams, categories);
  const visibleDashboards = allDashboards;
  const filteredDashboards = filterDashboards(visibleDashboards, categories, filters);
  const canCreate = hasPermission(currentUser, "dashboard:create");
  const publicCount = visibleDashboards.filter((d) => d.sensitivity === "public").length;
  const internalCount = visibleDashboards.filter(
    (d) => d.sensitivity === "internal" || d.sensitivity === "confidential",
  ).length;
  const inReviewCount = visibleDashboards.filter((d) => d.status === "in_review").length;
  const filteredActive =
    filters.q !== "" ||
    filters.category !== "all" ||
    filters.provider !== "all" ||
    filters.status !== "all" ||
    filters.access !== "all";

  const fieldClass =
    "h-10 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors duration-150 placeholder:text-[oklch(0.66_0.01_255)] focus:border-[oklch(0.5_0.14_258)] focus:ring-2 focus:ring-[oklch(0.95_0.028_258)]";

  return (
    <main
      className="min-h-screen"
      style={{ background: palette.base, color: palette.ink }}
    >
      {/* Compact command-bar header */}
      <header
        className="border-b"
        style={{ background: palette.paper, borderColor: palette.border }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: palette.accent }}
                aria-hidden="true"
              />
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: palette.accentDeep }}
              >
                ระบบภายใน · catalog
              </p>
            </div>
            <h1
              className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight"
              style={{ color: palette.ink }}
            >
              รายการรายงาน
            </h1>
            <p className="mt-1 text-sm" style={{ color: palette.inkMuted }}>
              ค้นหา เปิดดู และจัดการรายงานตามสิทธิ์ของผู้ใช้หลังเข้าสู่ระบบ
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/public"
              className="inline-flex h-10 items-center rounded-md border px-3.5 text-sm font-semibold transition-colors duration-150"
              style={{
                background: palette.paper,
                borderColor: palette.border,
                color: palette.ink,
              }}
            >
              ดูหน้าสาธารณะ
            </Link>
            {canCreate ? (
              <Link
                href="/dashboards/new"
                className="inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:brightness-110"
                style={{ background: palette.ink }}
              >
                <span aria-hidden="true">+</span>
                เพิ่มรายงาน
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-5 py-6">
        {/* KPI strip — differentiated, "ผลลัพธ์" is the focal active tile */}
        <section
          className="grid gap-px overflow-hidden rounded-xl"
          style={{ background: palette.border }}
        >
          <div className="grid gap-px md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div
              className="relative px-5 py-4"
              style={{ background: palette.accentSoft }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: palette.accentDeep }}>
                {filteredActive ? "ผลลัพธ์ตามตัวกรอง" : "ผลลัพธ์ทั้งหมด"}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <strong
                  className="text-[34px] font-semibold leading-none tracking-tight"
                  style={{ color: palette.accentDeep }}
                >
                  {filteredDashboards.length.toLocaleString("th-TH")}
                </strong>
                <span className="text-sm" style={{ color: palette.accentDeep, opacity: 0.7 }}>
                  / {visibleDashboards.length.toLocaleString("th-TH")} รายการที่เปิดได้
                </span>
              </div>
              {filteredActive ? (
                <Link
                  href="/catalog"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline"
                  style={{ color: palette.accentDeep }}
                >
                  ล้างตัวกรอง ↺
                </Link>
              ) : (
                <p className="mt-2 text-xs" style={{ color: palette.accentDeep, opacity: 0.65 }}>
                  ทุกรายงานที่บัญชีนี้เข้าถึงได้
                </p>
              )}
            </div>
            <KpiCell label="สาธารณะ" value={publicCount} accent={palette.emerald} />
            <KpiCell label="ต้องเข้าสู่ระบบ" value={internalCount} accent={palette.indigo} />
            <KpiCell label="รอตรวจสอบ" value={inReviewCount} accent={palette.amber} />
          </div>
        </section>

        {/* Filters — labeled, dense, single row */}
        <section
          className="rounded-xl border p-4"
          style={{ background: palette.paper, borderColor: palette.border }}
        >
          <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
            <FilterField label="ค้นหา">
              <input
                name="q"
                className={`${fieldClass}`}
                style={{ borderColor: palette.border }}
                placeholder="ชื่อรายงาน, เจ้าของ, tag, หมวดหมู่..."
                defaultValue={filters.q}
              />
            </FilterField>
            <FilterField label="หมวดรายงาน">
              <select
                name="category"
                className={fieldClass}
                style={{ borderColor: palette.border, color: palette.ink }}
                defaultValue={filters.category}
              >
                <option value="all">ทุกหมวด</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {"— ".repeat(category.depth)}
                    {category.name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="สิทธิ์เข้าถึง">
              <select
                name="access"
                className={fieldClass}
                style={{ borderColor: palette.border, color: palette.ink }}
                defaultValue={filters.access}
              >
                <option value="all">ทั้งหมด</option>
                <option value="public">สาธารณะ</option>
                <option value="login_required">ต้องเข้าสู่ระบบ</option>
                <option value="restricted">จำกัดสิทธิ์</option>
              </select>
            </FilterField>
            <FilterField label="สถานะ">
              <select
                name="status"
                className={fieldClass}
                style={{ borderColor: palette.border, color: palette.ink }}
                defaultValue={filters.status}
              >
                <option value="all">ทั้งหมด</option>
                <option value="published">เผยแพร่แล้ว</option>
                <option value="in_review">รอตรวจสอบ</option>
                <option value="draft">ร่าง</option>
                <option value="rejected">ตีกลับ</option>
                <option value="archived">เก็บถาวร</option>
              </select>
            </FilterField>
            <FilterField label="เรียงตาม">
              <select
                name="sort"
                className={fieldClass}
                style={{ borderColor: palette.border, color: palette.ink }}
                defaultValue={filters.sort}
              >
                <option value="updated_desc">อัปเดตล่าสุด</option>
                <option value="updated_asc">อัปเดตเก่าสุด</option>
                <option value="views_desc">ยอดดูสูงสุด</option>
                <option value="title_asc">ชื่อ A-Z</option>
              </select>
            </FilterField>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-md px-5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 lg:w-auto"
                style={{ background: palette.ink }}
              >
                ค้นหา
              </button>
            </div>
          </form>
        </section>

        {/* Main grid: rail + results */}
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <CategoryRail categories={categoryTree} selectedCategory={filters.category} />

          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold" style={{ color: palette.ink }}>
                ผลลัพธ์
                <span className="ml-2 text-sm font-normal" style={{ color: palette.inkMuted }}>
                  {filteredDashboards.length.toLocaleString("th-TH")} รายการ
                </span>
              </h2>
            </div>

            {filteredDashboards.length ? (
              <div className="space-y-3">
                {filteredDashboards.map((dashboard) => (
                  <ReportRow key={dashboard.id} currentUser={currentUser} dashboard={dashboard} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl border-2 border-dashed px-6 py-12 text-center"
                style={{ borderColor: palette.border, background: palette.paper }}
              >
                <h3 className="text-base font-semibold" style={{ color: palette.ink }}>
                  ไม่พบรายงานที่ตรงกับเงื่อนไข
                </h3>
                <p className="mt-1.5 text-sm" style={{ color: palette.inkMuted }}>
                  ลองลดเงื่อนไขการค้นหา หรือเลือกหมวดรายงานอื่น
                </p>
                <Link
                  href="/catalog"
                  className="mt-4 inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-white"
                  style={{ background: palette.ink }}
                >
                  ล้างตัวกรองทั้งหมด
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function KpiCell({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="px-5 py-4" style={{ background: palette.paper }}>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
          aria-hidden="true"
        />
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: palette.inkMuted }}>
          {label}
        </p>
      </div>
      <strong
        className="mt-1 block text-[26px] font-semibold leading-tight tracking-tight"
        style={{ color: palette.ink }}
      >
        {value.toLocaleString("th-TH")}
      </strong>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: palette.inkMuted }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
