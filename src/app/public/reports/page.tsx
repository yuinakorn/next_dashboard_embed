import { listPortalCategories } from "@/lib/db/categories";
import { listPublishedDashboardsForPortal } from "@/lib/db/dashboards";

export const dynamic = "force-dynamic";
import {
  CategoryTree,
  filterDashboards,
  normalizeSearchParams,
  ReportCard,
  ReportSearchForm,
  type PublicSearchParams,
  visibleCategoryRoots,
} from "../public-ui";

export default async function PublicReportsPage({
  searchParams,
}: {
  searchParams: Promise<PublicSearchParams>;
}) {
  const filters = normalizeSearchParams(await searchParams);
  const [categories, publishedDashboards] = await Promise.all([
    listPortalCategories(),
    listPublishedDashboardsForPortal(),
  ]);
  const categoryRoots = visibleCategoryRoots(categories);
  const filteredDashboards = filterDashboards(publishedDashboards, categoryRoots, filters);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-4">
          <h2 className="text-base font-semibold text-[oklch(0.21_0.015_255)]">หมวดรายงาน</h2>
          <div className="mt-4">
            <CategoryTree categories={categoryRoots} activeCategoryId={filters.category} />
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[oklch(0.21_0.015_255)]">รายงานสุขภาพ</h2>
          <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">
            ค้นหาและกรองรายงานที่เผยแพร่แล้วทั้งหมด
          </p>
        </section>

        <ReportSearchForm filters={filters} categories={categoryRoots} />

        <section>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-[oklch(0.21_0.015_255)]">ผลการค้นหา</h3>
            <span className="text-sm font-semibold text-[oklch(0.5_0.012_255)]">{filteredDashboards.length} รายการ</span>
          </div>
          <div className="mt-4 grid gap-3">
            {filteredDashboards.map((dashboard) => (
              <ReportCard key={dashboard.id} dashboard={dashboard} />
            ))}
          </div>
          {!filteredDashboards.length ? (
            <div className="mt-4 rounded-xl border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] px-4 py-8 text-center text-sm text-[oklch(0.5_0.012_255)]">
              ไม่พบรายงานที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
