import { listPortalCategories } from "@/lib/db/categories";
import { listPublishedDashboardsForPortal } from "@/lib/db/dashboards";
import { notFound } from "next/navigation";
import {
  CategoryCard,
  CategoryTree,
  collectCategoryIds,
  findCategory,
  ReportCard,
  visibleCategoryRoots,
} from "../../public-ui";

type PublicCategoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PublicCategoryPage({ params }: PublicCategoryPageProps) {
  const { id } = await params;
  const [categories, publishedDashboards] = await Promise.all([
    listPortalCategories(),
    listPublishedDashboardsForPortal(),
  ]);
  const categoryRoots = visibleCategoryRoots(categories);
  const category = findCategory(categoryRoots, id);

  if (!category) {
    notFound();
  }

  const categoryIds = new Set(collectCategoryIds(category));
  const categoryDashboards = publishedDashboards.filter((dashboard) => categoryIds.has(dashboard.categoryId));
  const childCategories = (category.children ?? []).filter((child) => child.totalPublishedReportCount > 0);

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-4">
          <h2 className="text-base font-semibold text-[oklch(0.21_0.015_255)]">หมวดรายงาน</h2>
          <div className="mt-4">
            <CategoryTree categories={categoryRoots} activeCategoryId={category.id} />
          </div>
        </div>
      </aside>

      <div className="space-y-8">
        <section className="rounded-xl border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-5">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "oklch(0.5 0.14 258)" }}
              aria-hidden="true"
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[oklch(0.4_0.13_260)]">
              {(category.path ?? [category.name]).slice(0, -1).join(" / ") || "หมวดหลัก"}
            </p>
          </div>
          <h2 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight text-[oklch(0.21_0.015_255)]">
            {category.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-sm">
            <span>
              <strong className="text-base font-semibold tabular-nums text-[oklch(0.21_0.015_255)]">
                {category.totalPublishedReportCount}
              </strong>
              <span className="ml-1 text-[oklch(0.5_0.012_255)]">รายงานทั้งหมด</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[oklch(0.5_0.012_255)]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "oklch(0.55 0.11 165)" }}
                aria-hidden="true"
              />
              เปิดดูได้ {category.publicReportCount}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[oklch(0.5_0.012_255)]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: "oklch(0.48 0.12 270)" }}
                aria-hidden="true"
              />
              ต้อง login {category.loginRequiredReportCount}
            </span>
          </div>
        </section>

        {childCategories.length ? (
          <section>
            <h3 className="text-base font-semibold text-[oklch(0.21_0.015_255)]">หมวดย่อย</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {childCategories.map((child) => (
                <CategoryCard key={child.id} category={child} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-[oklch(0.21_0.015_255)]">รายงานในหมวดนี้</h3>
            <span className="text-sm font-semibold text-[oklch(0.5_0.012_255)]">{categoryDashboards.length} รายการ</span>
          </div>
          <div className="mt-4 grid gap-3">
            {categoryDashboards.map((dashboard) => (
              <ReportCard key={dashboard.id} dashboard={dashboard} />
            ))}
          </div>
          {!categoryDashboards.length ? (
            <div className="mt-4 rounded-xl border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] px-4 py-8 text-center text-sm text-[oklch(0.5_0.012_255)]">
              ยังไม่มีรายงานในหมวดนี้
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
