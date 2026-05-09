import { Badge, buttonStyles, fieldStyles } from "@/components/dashboard-ui";
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

const providerStyles: Record<DashboardProvider, string> = {
  "Looker Studio": "border-sky-200 bg-sky-50 text-sky-800",
  Superset: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Grafana: "border-amber-200 bg-amber-50 text-amber-900",
  Metabase: "border-cyan-200 bg-cyan-50 text-cyan-800",
  "Power BI": "border-yellow-200 bg-yellow-50 text-yellow-900",
  Custom: "border-slate-200 bg-slate-100 text-slate-700",
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
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.75)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Report signal
          </p>
          <h2 className="mt-1 line-clamp-1 text-lg font-semibold text-slate-950">
            {dashboard?.title ?? "ภาพรวมรายงานสุขภาพ"}
          </h2>
        </div>
        <Badge className="bg-emerald-50 text-emerald-800">Published</Badge>
      </div>
      <div className="mt-6 grid grid-cols-12 items-end gap-2" aria-hidden="true">
        {[42, 58, 50, 72, 64, 86, 76, 92, 70, 82, 96, 88].map((height, index) => (
          <div key={`${height}-${index}`} className="flex h-32 items-end rounded bg-slate-100 px-1">
            <div
              className={`w-full rounded-sm ${
                index > 8 ? "bg-sky-700" : index > 4 ? "bg-cyan-500" : "bg-emerald-500"
              }`}
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-slate-100 p-3">
          <dt className="text-xs font-semibold text-slate-500">รายงานทั้งหมด</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-950">{reportCount}</dd>
        </div>
        <div className="rounded-md bg-emerald-50 p-3">
          <dt className="text-xs font-semibold text-emerald-900">เปิดดูได้</dt>
          <dd className="mt-1 text-2xl font-semibold text-emerald-900">{publicCount}</dd>
        </div>
        <div className="rounded-md bg-slate-100 p-3">
          <dt className="text-xs font-semibold text-slate-500">ต้อง login</dt>
          <dd className="mt-1 text-2xl font-semibold text-slate-950">{loginRequiredCount}</dd>
        </div>
      </dl>
    </div>
  );
}

export function CategoryCard({ category }: { category: PortalCategory }) {
  return (
    <Link
      href={`/public/categories/${category.id}`}
      className="group rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 transition duration-200 hover:border-slate-300 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">
            {(category.path ?? [category.name]).slice(0, -1).join(" / ") || "หมวดหลัก"}
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-950 group-hover:text-sky-800">
            {category.name}
          </h2>
        </div>
        <span className="rounded-md bg-slate-200 px-2 py-1 text-sm font-semibold text-slate-800">
          {category.totalPublishedReportCount}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-800">
          เปิดดูได้ {category.publicReportCount}
        </span>
        {category.loginRequiredReportCount ? (
          <span className="rounded bg-amber-50 px-2 py-1 text-amber-900">
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
    <ul className={level === 0 ? "space-y-1" : "mt-1 space-y-1 border-l border-slate-200 pl-3"}>
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;
        return (
          <li key={category.id}>
            <Link
              href={`/public/categories/${category.id}`}
              className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${
                isActive
                  ? "bg-slate-900 text-slate-50"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <span className="min-w-0 truncate">{category.name}</span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                  isActive ? "bg-slate-700 text-slate-100" : "bg-slate-100 text-slate-600"
                }`}
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
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <form action={action} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
          <label className="min-w-0">
            <span className="sr-only">ค้นหารายงานสุขภาพ</span>
            <input
              name="q"
              className={`${fieldStyles} h-11 w-full`}
              placeholder="ค้นหาชื่อรายงาน ตัวชี้วัด หมวด หรือ tag..."
              defaultValue={filters.q}
            />
          </label>
          <button type="submit" className={`${buttonStyles.primary} h-11 justify-center`}>
            ค้นหา
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[190px_minmax(220px,1fr)_170px_160px_96px]">
          <select name="provider" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.provider}>
            <option value="all">ทุก provider</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          <select name="category" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.category}>
            <option value="all">ทุกหมวด</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {"- ".repeat(category.depth ?? 0)}
                {category.name}
              </option>
            ))}
          </select>
          <select name="access" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.access}>
            <option value="all">ทุกสิทธิ์เข้าถึง</option>
            <option value="public">เปิดดูได้ทันที</option>
            <option value="login">ต้อง login</option>
          </select>
          <select name="sort" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.sort}>
            <option value="views_desc">ยอดดูสูงสุด</option>
            <option value="updated_desc">อัปเดตล่าสุด</option>
            <option value="title_asc">ชื่อ A-Z</option>
          </select>
          <Link href="/public/reports" className={`${buttonStyles.secondary} h-11 justify-center`}>
            ล้าง
          </Link>
        </div>
      </form>
    </section>
  );
}

export function ReportCard({ dashboard }: { dashboard: Dashboard }) {
  const isPublic = dashboard.sensitivity === "public";

  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 transition duration-200 hover:border-slate-300 hover:bg-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={isPublic ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}>
              {sensitivityLabels[dashboard.sensitivity]}
            </Badge>
            <Badge className={providerStyles[dashboard.provider]}>{dashboard.provider}</Badge>
            <span className="text-xs font-medium text-slate-500">{dashboard.updatedAt}</span>
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
            {dashboard.title}
          </h3>
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">
            {dashboard.description}
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {dashboard.categoryPath?.join(" / ") ?? dashboard.categoryName}
          </p>
          {dashboard.tags.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {dashboard.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
          {isPublic ? (
            <Link href={`/public/reports/${dashboard.id}`} className={`${buttonStyles.primary} h-10 justify-center`}>
              เปิดรายงาน
            </Link>
          ) : (
            <Link
              href={`/login?next=/dashboards/${dashboard.id}`}
              className={`${buttonStyles.primary} h-10 justify-center`}
            >
              เข้าสู่ระบบเพื่อเปิด
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
