import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { flattenCategories } from "@/lib/category-utils";
import { listCategories } from "@/lib/db/categories";
import { getDashboard } from "@/lib/db/dashboards";
import { canCreateDashboard, canUpdateDashboard, getUserPermissions } from "@/lib/permissions";
import { EditDashboardForm } from "../../new/new-dashboard-form";

type EditDashboardPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditDashboardPage({ params }: EditDashboardPageProps) {
  const currentUser = await requireCurrentUser();
  const { id } = await params;
  const dashboard = await getDashboard(id, currentUser.id);

  if (!dashboard || !canUpdateDashboard(currentUser, dashboard)) {
    notFound();
  }

  const categories = await listCategories();
  const permissions = getUserPermissions(currentUser);
  const categoryOptions = flattenCategories(categories).filter(
    (category) => category.id === dashboard.categoryId || canCreateDashboard(currentUser, category.id),
  );

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="แก้ไขรายการ"
        title={dashboard.title}
        description="แก้ metadata, URL และ governance context ของ Dashboard"
        maxWidth="max-w-5xl"
        actions={[
          { href: `/dashboards/${dashboard.id}`, label: "กลับไป Viewer" },
          { href: "/catalog", label: "Catalog", primary: true },
        ]}
      />

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 lg:grid-cols-[1fr_280px]">
        <EditDashboardForm categoryOptions={categoryOptions} dashboard={dashboard} />

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">สถานะปัจจุบัน</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1 font-semibold text-slate-900">{dashboard.status}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</dt>
                <dd className="mt-1 font-semibold text-slate-900">{dashboard.owner}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
                <dd className="mt-1 font-semibold text-slate-900">{dashboard.updatedAt}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">หมวดหมู่ที่เลือกได้</h2>
            <div className="mt-3 space-y-2">
              {categoryOptions.map((category) => (
                <div
                  key={category.id}
                  className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700"
                >
                  {"- ".repeat(category.depth)}
                  {category.name}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">สิทธิ์ที่มีในขณะนี้</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span key={permission} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {permission}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
