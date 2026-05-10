import Link from "next/link";
import {
  Badge,
  FilterShell,
  MetricTile,
  PageHeader,
  buttonStyles,
  fieldStyles,
} from "@/components/dashboard-ui";
import { CategoryRail } from "./category-rail";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listCategories } from "@/lib/db/categories";
import { listDashboardsForUser } from "@/lib/db/dashboards";
import { getEmbedStatusTone } from "@/lib/embed-policy";
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

const statusTone: Record<DashboardStatus, string> = {
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

const sensitivityTone: Record<SensitivityLevel, string> = {
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

const embedLabels: Record<EmbedStatus, string> = {
  embeddable: "ฝังได้",
  unknown: "รอตรวจ",
  external_only: "เปิดภายนอก",
  blocked: "ถูกบล็อก",
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

function getAllowedActions(currentUser: PortalUser, dashboard: Dashboard) {
  const canUpdate = canUpdateDashboard(currentUser, dashboard);

  return {
    canUpdate,
  };
}

function ReportCard({ currentUser, dashboard }: { currentUser: PortalUser; dashboard: Dashboard }) {
  const actions = getAllowedActions(currentUser, dashboard);
  const categoryPath = dashboard.categoryPath?.length
    ? dashboard.categoryPath.join(" / ")
    : dashboard.categoryName;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusTone[dashboard.status]}>{statusLabels[dashboard.status]}</Badge>
            <Badge className={sensitivityTone[dashboard.sensitivity]}>
              {sensitivityLabels[dashboard.sensitivity]}
            </Badge>
            <span
              className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getEmbedStatusTone(dashboard.embedStatus)}`}
            >
              {embedLabels[dashboard.embedStatus]}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-semibold leading-6 text-slate-950">{dashboard.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{dashboard.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {dashboard.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <Link href={`/dashboards/${dashboard.id}`} className={`${buttonStyles.primary} h-10`}>
            เปิดรายงาน
          </Link>
          {actions.canUpdate ? (
            <Link href={`/dashboards/${dashboard.id}/edit`} className={`${buttonStyles.secondary} h-10`}>
              แก้ไข
            </Link>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm md:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold text-slate-500">หมวดรายงาน</dt>
          <dd className="mt-1 line-clamp-2 font-medium text-slate-800">{categoryPath}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">Provider</dt>
          <dd className="mt-1 font-medium text-slate-800">{dashboard.provider}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">เจ้าของ</dt>
          <dd className="mt-1 truncate font-medium text-slate-800">{dashboard.owner}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">อัปเดต / ยอดดู</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {dashboard.updatedAt} · {dashboard.views.toLocaleString("th-TH")}
          </dd>
        </div>
      </dl>
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
  const internalCount = visibleDashboards.filter(
    (dashboard) => dashboard.sensitivity === "internal" || dashboard.sensitivity === "confidential",
  ).length;

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="ระบบภายใน"
        title="รายการรายงาน"
        description="ค้นหา เปิดดู และจัดการรายงานตามสิทธิ์ของผู้ใช้หลังเข้าสู่ระบบ"
        actions={[
          ...(canCreate ? [{ href: "/dashboards/new", label: "เพิ่มรายงาน", primary: true }] : []),
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        <section className="grid gap-4 md:grid-cols-4">
          <MetricTile label="รายงานที่เปิดได้" value={visibleDashboards.length} tone="info" />
          <MetricTile
            label="รายงานสาธารณะ"
            value={visibleDashboards.filter((dashboard) => dashboard.sensitivity === "public").length}
            tone="success"
          />
          <MetricTile label="ต้องเข้าสู่ระบบ" value={internalCount} tone="neutral" />
          <MetricTile label="ผลลัพธ์" value={filteredDashboards.length} tone="review" />
        </section>

        <FilterShell>
          <form className="grid gap-3 lg:grid-cols-[1fr_220px_170px_160px_150px_120px]">
            <label>
              <span className="sr-only">ค้นหารายงาน</span>
              <input
                name="q"
                className={`${fieldStyles} h-11 w-full`}
                placeholder="ค้นหาด้วยชื่อรายงาน เจ้าของ tag หรือหมวดหมู่..."
                defaultValue={filters.q}
              />
            </label>
            <select name="category" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.category}>
              <option value="all">ทุกหมวดรายงาน</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {"- ".repeat(category.depth)}
                  {category.name}
                </option>
              ))}
            </select>
            <select name="access" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.access}>
              <option value="all">ทุกสิทธิ์เข้าถึง</option>
              <option value="public">สาธารณะ</option>
              <option value="login_required">ต้องเข้าสู่ระบบ</option>
              <option value="restricted">จำกัดสิทธิ์</option>
            </select>
            <select name="status" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.status}>
              <option value="all">ทุกสถานะ</option>
              <option value="published">เผยแพร่แล้ว</option>
              <option value="in_review">รอตรวจสอบ</option>
              <option value="draft">ร่าง</option>
              <option value="rejected">ตีกลับ</option>
              <option value="archived">เก็บถาวร</option>
            </select>
            <select name="sort" className={`${fieldStyles} h-11 text-slate-700`} defaultValue={filters.sort}>
              <option value="updated_desc">อัปเดตล่าสุด</option>
              <option value="updated_asc">อัปเดตเก่าสุด</option>
              <option value="views_desc">ยอดดูสูงสุด</option>
              <option value="title_asc">ชื่อ A-Z</option>
            </select>
            <button type="submit" className={`${buttonStyles.primary} h-11 justify-center`}>
              ค้นหา
            </button>
          </form>
        </FilterShell>

        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <CategoryRail categories={categoryTree} selectedCategory={filters.category} />

          <section className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">ผลลัพธ์รายงาน</h2>
                <p className="mt-1 text-sm text-slate-500">
                  พบ {filteredDashboards.length.toLocaleString("th-TH")} รายการจากทั้งหมด{" "}
                  {visibleDashboards.length.toLocaleString("th-TH")} รายการที่บัญชีนี้เปิดได้
                </p>
              </div>
              <Link href="/public" className={`${buttonStyles.secondary} h-10 w-fit`}>
                ดูหน้าสาธารณะ
              </Link>
            </div>

            {filteredDashboards.length ? (
              <div className="grid gap-4">
                {filteredDashboards.map((dashboard) => (
                  <ReportCard key={dashboard.id} currentUser={currentUser} dashboard={dashboard} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                <h3 className="text-base font-semibold text-slate-950">ไม่พบรายงานที่ตรงกับเงื่อนไข</h3>
                <p className="mt-2 text-sm text-slate-500">ลองลดเงื่อนไขการค้นหา หรือเลือกหมวดรายงานอื่น</p>
                <Link href="/catalog" className={`${buttonStyles.secondary} mt-4 h-10`}>
                  ล้างตัวกรอง
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
