import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/dashboard-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { flattenCategories } from "@/lib/category-utils";
import { listCategories } from "@/lib/db/categories";
import { getDashboard } from "@/lib/db/dashboards";
import {
  canArchiveDashboard,
  canCreateDashboard,
  canPublishDashboard,
  canUpdateDashboard,
  getUserPermissions,
} from "@/lib/permissions";
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
  const canManageStatus =
    canPublishDashboard(currentUser, dashboard) || canArchiveDashboard(currentUser, dashboard);

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <div className="mx-auto max-w-7xl px-5 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
              <li>
                <Link href="/catalog" className="hover:text-slate-900 hover:underline">
                  รายการรายงาน
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">/</li>
              <li>
                <Link
                  href={`/dashboards/${dashboard.id}`}
                  className="hover:text-slate-900 hover:underline truncate max-w-[40vw] inline-block align-bottom"
                >
                  {dashboard.title}
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">/</li>
              <li aria-current="page" className="font-medium text-slate-700">
                แก้ไข
              </li>
            </ol>
          </nav>
          <Link
            href={`/dashboards/${dashboard.id}`}
            className={`${buttonStyles.secondary} h-9 px-3 text-xs`}
          >
            ยกเลิก
          </Link>
        </div>
        <div className="mt-3">
          <span className="text-xs font-medium text-slate-500">แก้ไขรายงาน</span>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
            {dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            แก้ข้อมูลกำกับรายงาน URL หมวดรายงาน และสิทธิ์การเข้าถึง
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1fr_280px]">
        <EditDashboardForm
          categoryOptions={categoryOptions}
          dashboard={dashboard}
          canManageStatus={canManageStatus}
        />

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">สถานะปัจจุบัน</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-500">สถานะ</dt>
                <dd className="mt-1 font-semibold text-slate-900">{dashboard.status}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">เจ้าของรายงาน</dt>
                <dd className="mt-1 font-semibold text-slate-900">{dashboard.owner}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">อัปเดตล่าสุด</dt>
                <dd className="mt-1 font-semibold text-slate-900">{dashboard.updatedAt}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">หมวดรายงานที่เลือกได้</h2>
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

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
