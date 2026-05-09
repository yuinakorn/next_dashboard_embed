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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-base font-semibold text-slate-950">หมวดรายงาน</h2>
          <div className="mt-4">
            <CategoryTree categories={categoryRoots} activeCategoryId={category.id} />
          </div>
        </div>
      </aside>

      <div className="space-y-8">
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold text-slate-500">
            {(category.path ?? [category.name]).slice(0, -1).join(" / ") || "หมวดหลัก"}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{category.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                รวม {category.totalPublishedReportCount} รายงาน, เปิดดูได้ {category.publicReportCount}, ต้อง login {category.loginRequiredReportCount}
              </p>
            </div>
          </div>
        </section>

        {childCategories.length ? (
          <section>
            <h3 className="text-base font-semibold text-slate-950">หมวดย่อย</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {childCategories.map((child) => (
                <CategoryCard key={child.id} category={child} />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-slate-950">รายงานในหมวดนี้</h3>
            <span className="text-sm font-semibold text-slate-500">{categoryDashboards.length} รายการ</span>
          </div>
          <div className="mt-4 grid gap-3">
            {categoryDashboards.map((dashboard) => (
              <ReportCard key={dashboard.id} dashboard={dashboard} />
            ))}
          </div>
          {!categoryDashboards.length ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              ยังไม่มีรายงานในหมวดนี้
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
