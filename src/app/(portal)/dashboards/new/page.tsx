import Link from "next/link";
import { buttonStyles } from "@/components/dashboard-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { flattenCategories } from "@/lib/category-utils";
import { listCategories } from "@/lib/db/categories";
import { canCreateDashboard, getUserPermissions } from "@/lib/permissions";
import { NewDashboardForm } from "./new-dashboard-form";

export default async function NewDashboardPage() {
  const currentUser = await requireCurrentUser();
  const categories = await listCategories();
  const permissions = getUserPermissions(currentUser);
  const categoryOptions = flattenCategories(categories).filter((category) =>
    canCreateDashboard(currentUser, category.id),
  );

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
              <li aria-current="page" className="font-medium text-slate-700">
                เพิ่มรายงานใหม่
              </li>
            </ol>
          </nav>
          <Link href="/catalog" className={`${buttonStyles.secondary} h-9 px-3 text-xs`}>
            ยกเลิก
          </Link>
        </div>
        <div className="mt-3">
          <span className="text-xs font-medium text-slate-500">เพิ่มรายงาน</span>
          <h1 className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
            เพิ่มรายงานใหม่
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            บันทึกข้อมูลกำกับรายงาน กำหนดหมวด สิทธิ์เข้าถึง และตรวจความพร้อมของ embed
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1fr_280px]">
        <NewDashboardForm categoryOptions={categoryOptions} />

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">หมวดรายงานที่สร้างได้</h2>
            <div className="mt-3 space-y-2">
              {categoryOptions.map((category) => (
                <div key={category.id} className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
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
