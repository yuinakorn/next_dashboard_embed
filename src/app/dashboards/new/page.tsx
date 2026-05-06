import { PageHeader } from "@/components/dashboard-ui";
import { getCurrentUser } from "@/lib/auth/current-user";
import { flattenCategories } from "@/lib/category-utils";
import { listCategories } from "@/lib/db/categories";
import { canCreateDashboard, getUserPermissions } from "@/lib/permissions";
import { NewDashboardForm } from "./new-dashboard-form";

export default async function NewDashboardPage() {
  const currentUser = await getCurrentUser();
  const categories = await listCategories();
  const permissions = getUserPermissions(currentUser);
  const categoryOptions = flattenCategories(categories).filter((category) =>
    canCreateDashboard(currentUser, category.id),
  );

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="สร้างรายการใหม่"
        title="สร้าง Dashboard"
        description="บันทึก metadata, ตรวจ embed health และส่งเข้าสู่ workflow review"
        maxWidth="max-w-5xl"
        actions={[
          { href: "/catalog", label: "กลับไป Catalog" },
          { href: "/", label: "หน้าหลัก", primary: true },
        ]}
      />

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 lg:grid-cols-[1fr_280px]">
        <NewDashboardForm categoryOptions={categoryOptions} />

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">ผู้ใช้ปัจจุบัน</h2>
            <p className="mt-2 text-sm font-semibold text-slate-700">{currentUser.name}</p>
            <p className="mt-1 text-sm text-slate-500">{currentUser.department}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentUser.roles.map((role) => (
                <span key={role} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {role}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">หมวดหมู่ที่สร้างได้</h2>
            <div className="mt-3 space-y-2">
              {categoryOptions.map((category) => (
                <div key={category.id} className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
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
