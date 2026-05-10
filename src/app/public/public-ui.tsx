import { buttonStyles, fieldStyles } from "@/components/dashboard-ui";
import { palette } from "@/lib/design-tokens";
import type { PortalCategory } from "@/lib/db/categories";
import type { Dashboard, DashboardProvider, SensitivityLevel } from "@/lib/portal-types";
import Link from "next/link";

export const providers: DashboardProvider[] = [
  "Looker Studio",
  "Superset",
  "Grafana",
  "Metabase",
  "Power BI",
  "Custom",
];

export const sortOptions = ["views_desc", "updated_desc", "title_asc"] as const;

export type PublicSearchParams = {
  q?: string;
  provider?: string;
  category?: string;
  access?: string;
  sort?: string;
};

const sensitivityLabels: Record<SensitivityLevel, string> = {
  public: "เปิดดูได้ทันที",
  internal: "ต้องเข้าสู่ระบบ",
  confidential: "ข้อมูลภายใน",
  restricted: "จำกัดสิทธิ์",
};

function isProvider(value: string): value is DashboardProvider {
  return providers.includes(value as DashboardProvider);
}

export function normalizeSearchParams(searchParams: PublicSearchParams) {
  return {
    q: searchParams.q?.trim() ?? "",
    provider: searchParams.provider && isProvider(searchParams.provider) ? searchParams.provider : "all",
    category: searchParams.category?.trim() || "all",
    access: searchParams.access === "public" || searchParams.access === "login" ? searchParams.access : "all",
    sort: sortOptions.includes(searchParams.sort as (typeof sortOptions)[number])
      ? (searchParams.sort as (typeof sortOptions)[number])
      : "views_desc",
  };
}

export function flattenCategories(categories: PortalCategory[]): PortalCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])]);
}

export function collectCategoryIds(category: PortalCategory): string[] {
  return [category.id, ...(category.children ?? []).flatMap(collectCategoryIds)];
}

export function visibleCategoryRoots(categories: PortalCategory[]) {
  const rootsWithReports = categories.filter((category) => category.totalPublishedReportCount > 0);
  return rootsWithReports.length ? rootsWithReports : categories;
}

export function findCategory(categories: PortalCategory[], id: string): PortalCategory | null {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    const child = findCategory(category.children ?? [], id);
    if (child) {
      return child;
    }
  }
  return null;
}

function dashboardMatchesQuery(dashboard: Dashboard, query: string): boolean {
  if (!query) {
    return true;
  }

  const searchable = [
    dashboard.title,
    dashboard.description,
    dashboard.provider,
    dashboard.categoryName,
    dashboard.owner,
    ...dashboard.tags,
  ]
    .join(" ")
    .toLocaleLowerCase("th-TH");

  return searchable.includes(query.toLocaleLowerCase("th-TH"));
}

export function filterDashboards(
  dashboards: Dashboard[],
  categories: PortalCategory[],
  filters: ReturnType<typeof normalizeSearchParams>,
) {
  const selectedCategory = flattenCategories(categories).find((category) => category.id === filters.category);
  const selectedCategoryIds = selectedCategory ? new Set(collectCategoryIds(selectedCategory)) : null;

  return dashboards
    .filter((dashboard) => dashboardMatchesQuery(dashboard, filters.q))
    .filter((dashboard) => filters.provider === "all" || dashboard.provider === filters.provider)
    .filter((dashboard) => !selectedCategoryIds || selectedCategoryIds.has(dashboard.categoryId))
    .filter((dashboard) => {
      if (filters.access === "public") {
        return dashboard.sensitivity === "public";
      }
      if (filters.access === "login") {
        return dashboard.sensitivity !== "public";
      }
      return true;
    })
    .sort((first, second) => {
      if (filters.sort === "updated_desc") {
        return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
      }
      if (filters.sort === "title_asc") {
        return first.title.localeCompare(second.title, "th-TH");
      }
      return second.views - first.views;
    });
}

export function PublicSignalPreview({
  dashboard,
  reportCount,
  publicCount,
  loginRequiredCount,
}: {
  dashboard?: Dashboard;
  reportCount: number;
  publicCount: number;
  loginRequiredCount: number;
}) {
  const featuredCount = dashboard ? 1 : 0;
  const barHeights = [42, 58, 50, 72, 64, 86, 76, 92, 70, 82, 96, 88];

  return (
    <div
      className="rounded-xl p-5 shadow-[0_24px_70px_-52px_oklch(0.21_0.015_255/0.4)]"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: palette.inkMuted }}
          >
            Open Data Portal
          </p>
          <h2
            className="mt-1 line-clamp-2 text-lg font-semibold leading-tight tracking-tight"
            style={{ color: palette.ink }}
          >
            Public Health Service Overview
          </h2>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: palette.emeraldSoft, color: palette.emeraldDeep }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: palette.emerald }}
            aria-hidden="true"
          />
          Published
        </span>
      </div>

      <div className="mt-5 grid grid-cols-12 items-end gap-1.5" aria-hidden="true">
        {barHeights.map((height, index) => {
          const color = index > 8 ? palette.accentDeep : index > 4 ? "oklch(0.6 0.12 220)" : palette.emerald;
          return (
            <div
              key={`${height}-${index}`}
              className="flex h-32 items-end rounded px-0.5"
              style={{ background: palette.muted }}
            >
              <div
                className="w-full rounded-sm transition-all duration-300"
                style={{ height: `${height}%`, background: color }}
              />
            </div>
          );
        })}
      </div>

      <dl className="mt-5 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md p-3" style={{ background: palette.emeraldSoft }}>
          <dt className="text-xs font-semibold" style={{ color: palette.emeraldDeep }}>
            Dashboard สาธารณะ
          </dt>
          <dd
            className="mt-1 text-2xl font-semibold tabular-nums"
            style={{ color: palette.emeraldDeep }}
          >
            {publicCount.toLocaleString("th-TH")}
          </dd>
        </div>
        <div className="rounded-md p-3" style={{ background: palette.accentSoft }}>
          <dt className="text-xs font-semibold" style={{ color: palette.accentDeep }}>
            รายการแนะนำ
          </dt>
          <dd
            className="mt-1 text-2xl font-semibold tabular-nums"
            style={{ color: palette.accentDeep }}
          >
            {featuredCount.toLocaleString("th-TH")}
          </dd>
        </div>
        <div className="rounded-md p-3" style={{ background: palette.muted }}>
          <dt className="text-xs font-semibold" style={{ color: palette.inkMuted }}>
            ต้องเข้าสู่ระบบ
          </dt>
          <dd
            className="mt-1 text-2xl font-semibold tabular-nums"
            style={{ color: palette.ink }}
          >
            {loginRequiredCount.toLocaleString("th-TH")}
          </dd>
        </div>
      </dl>
      {/* keep reportCount referenced for callers that pass it */}
      <span className="sr-only">รายงานทั้งหมด {reportCount}</span>
    </div>
  );
}

export function CategoryCard({ category }: { category: PortalCategory }) {
  const parentPath = (category.path ?? [category.name]).slice(0, -1).join(" / ");

  return (
    <Link
      href={`/public/categories/${category.id}`}
      className="group block rounded-xl px-4 py-4 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: palette.paper,
        border: `1px solid ${palette.border}`,
        outlineColor: palette.accent,
      }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1">
          {parentPath ? (
            <p
              className="truncate text-[11px] font-medium"
              style={{ color: palette.inkFaint }}
            >
              {parentPath}
            </p>
          ) : null}
          <h2
            className="mt-0.5 truncate text-[15px] font-semibold tracking-tight transition-colors duration-150 group-hover:underline-offset-4 group-hover:underline"
            style={{ color: palette.ink, textDecorationColor: palette.accent }}
          >
            {category.name}
          </h2>
        </div>
        <span
          className="shrink-0 text-[22px] font-semibold tabular-nums leading-none"
          style={{ color: palette.ink }}
        >
          {category.totalPublishedReportCount}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[12px]">
        <span className="inline-flex items-center gap-1.5" style={{ color: palette.inkMuted }}>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: palette.emerald }}
            aria-hidden="true"
          />
          เปิดดูได้ {category.publicReportCount}
        </span>
        {category.loginRequiredReportCount ? (
          <span className="inline-flex items-center gap-1.5" style={{ color: palette.inkMuted }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: palette.indigo }}
              aria-hidden="true"
            />
            ต้อง login {category.loginRequiredReportCount}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function CategoryGrid({ categories, limit }: { categories: PortalCategory[]; limit?: number }) {
  const visibleCategories = flattenCategories(categories)
    .filter((category) => category.totalPublishedReportCount > 0)
    .slice(0, limit);

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {visibleCategories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </section>
  );
}

export function CategoryTree({
  categories,
  activeCategoryId,
  level = 0,
}: {
  categories: PortalCategory[];
  activeCategoryId: string;
  level?: number;
}) {
  return (
    <ul
      className={level === 0 ? "space-y-0.5" : "mt-0.5 space-y-0.5 border-l pl-3"}
      style={level === 0 ? undefined : { borderColor: palette.border }}
    >
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;
        return (
          <li key={category.id}>
            <Link
              href={`/public/categories/${category.id}`}
              className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={{
                background: isActive ? palette.ink : undefined,
                color: isActive ? "white" : palette.ink,
                fontWeight: isActive ? 600 : 500,
                outlineColor: palette.accent,
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="min-w-0 truncate">{category.name}</span>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{
                  background: isActive ? "oklch(1 0 0 / 0.15)" : palette.muted,
                  color: isActive ? "oklch(0.92 0.005 255)" : palette.inkMuted,
                }}
              >
                {category.totalPublishedReportCount}
              </span>
            </Link>
            {category.children?.length ? (
              <CategoryTree
                categories={category.children.filter((child) => child.totalPublishedReportCount > 0)}
                activeCategoryId={activeCategoryId}
                level={level + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function ReportSearchForm({
  filters,
  categories,
  action = "/public/reports",
}: {
  filters: ReturnType<typeof normalizeSearchParams>;
  categories: PortalCategory[];
  action?: string;
}) {
  const categoryOptions = flattenCategories(categories).filter(
    (category) => category.totalPublishedReportCount > 0,
  );

  return (
    <section
      className="rounded-xl p-4"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <form action={action} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
          <label className="min-w-0">
            <span className="sr-only">ค้นหารายงานสุขภาพ</span>
            <input
              name="q"
              className={`${fieldStyles} h-10 w-full`}
              placeholder="ค้นหาชื่อรายงาน ตัวชี้วัด หมวด หรือ tag..."
              defaultValue={filters.q}
            />
          </label>
          <button type="submit" className={`${buttonStyles.primary} h-10 justify-center`}>
            ค้นหา
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[190px_minmax(220px,1fr)_170px_160px_96px]">
          <select name="provider" className={`${fieldStyles} h-10`} defaultValue={filters.provider}>
            <option value="all">ทุก provider</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          <select name="category" className={`${fieldStyles} h-10`} defaultValue={filters.category}>
            <option value="all">ทุกหมวด</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {"— ".repeat(category.depth ?? 0)}
                {category.name}
              </option>
            ))}
          </select>
          <select name="access" className={`${fieldStyles} h-10`} defaultValue={filters.access}>
            <option value="all">ทุกสิทธิ์เข้าถึง</option>
            <option value="public">เปิดดูได้ทันที</option>
            <option value="login">ต้อง login</option>
          </select>
          <select name="sort" className={`${fieldStyles} h-10`} defaultValue={filters.sort}>
            <option value="views_desc">ยอดดูสูงสุด</option>
            <option value="updated_desc">อัปเดตล่าสุด</option>
            <option value="title_asc">ชื่อ A-Z</option>
          </select>
          <Link href="/public/reports" className={`${buttonStyles.secondary} h-10 justify-center`}>
            ล้าง
          </Link>
        </div>
      </form>
    </section>
  );
}

export function ReportCard({ dashboard }: { dashboard: Dashboard }) {
  const isPublic = dashboard.sensitivity === "public";
  const accessDot = isPublic ? palette.emerald : palette.indigo;
  const accessInk = isPublic ? palette.emeraldDeep : palette.indigoDeep;
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
          <span className="inline-flex items-center gap-1.5" style={{ color: accessInk }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: accessDot }}
              aria-hidden="true"
            />
            <span className="font-semibold">{sensitivityLabels[dashboard.sensitivity]}</span>
          </span>
          <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
          <span style={{ color: palette.inkMuted }} className="font-medium">
            {dashboard.provider}
          </span>
          <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
          <span style={{ color: palette.inkFaint }}>{dashboard.updatedAt}</span>
        </div>
        <h3
          className="mt-2 text-[17px] font-semibold leading-6 tracking-tight"
          style={{ color: palette.ink }}
        >
          {dashboard.title}
        </h3>
        <p
          className="mt-1.5 line-clamp-2 max-w-3xl text-sm leading-6"
          style={{ color: palette.inkMuted }}
        >
          {dashboard.description}
        </p>
        <p className="mt-2 text-[12px]" style={{ color: palette.inkFaint }}>
          <span style={{ color: palette.inkMuted }}>หมวด</span> {categoryPath}
        </p>
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
      <div className="flex shrink-0 self-end lg:self-start">
        {isPublic ? (
          <Link
            href={`/public/reports/${dashboard.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: palette.ink, outlineColor: palette.accent }}
          >
            เปิดรายงาน
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <Link
            href={`/login?next=/dashboards/${dashboard.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:bg-[oklch(0.955_0.005_250)]"
            style={{
              borderColor: palette.border,
              color: palette.ink,
              outlineColor: palette.accent,
            }}
          >
            เข้าสู่ระบบเพื่อเปิด
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
