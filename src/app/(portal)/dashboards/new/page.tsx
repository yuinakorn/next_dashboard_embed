import Link from "next/link";
import { buttonStyles } from "@/components/dashboard-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";

export const dynamic = "force-dynamic";
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
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <div className="mx-auto max-w-7xl px-5 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[oklch(0.5_0.012_255)]">
              <li>
                <Link href="/catalog" className="hover:text-[oklch(0.21_0.015_255)] hover:underline">
                  รายการรายงาน
                </Link>
              </li>
              <li aria-hidden="true" className="text-[oklch(0.85_0.008_250)]">/</li>
              <li aria-current="page" className="font-medium text-[oklch(0.3_0.018_255)]">
                เพิ่มรายงานใหม่
              </li>
            </ol>
          </nav>
          <Link href="/catalog" className={`${buttonStyles.secondary} h-9 px-3 text-xs`}>
            ยกเลิก
          </Link>
        </div>
        <div className="mt-3">
          <span className="text-xs font-medium text-[oklch(0.5_0.012_255)]">เพิ่มรายงาน</span>
          <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.21_0.015_255)] md:text-2xl">
            เพิ่มรายงานใหม่
          </h1>
          <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">
            บันทึกข้อมูลกำกับรายงาน กำหนดหมวด สิทธิ์เข้าถึง และตรวจความพร้อมของ embed
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1fr_280px]">
        <NewDashboardForm categoryOptions={categoryOptions} />

        <aside className="space-y-4">
          <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[oklch(0.21_0.015_255)]">ผู้ใช้ปัจจุบัน</h2>
            <p className="mt-2 text-sm font-semibold text-[oklch(0.3_0.018_255)]">{currentUser.name}</p>
            <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">{currentUser.department}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentUser.roles.map((role) => (
                <span key={role} className="rounded-md bg-[oklch(0.955_0.005_250)] px-2 py-1 text-xs font-medium text-[oklch(0.5_0.012_255)]">
                  {role}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[oklch(0.21_0.015_255)]">หมวดรายงานที่สร้างได้</h2>
            <div className="mt-3 space-y-2">
              {categoryOptions.map((category) => (
                <div key={category.id} className="rounded-md border border-[oklch(0.91_0.006_250)] bg-[oklch(0.955_0.005_250)] px-3 py-2 text-sm text-[oklch(0.3_0.018_255)]">
                  {"- ".repeat(category.depth)}
                  {category.name}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[oklch(0.21_0.015_255)]">สิทธิ์ที่มีในขณะนี้</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span key={permission} className="rounded-md bg-[oklch(0.955_0.005_250)] px-2 py-1 text-xs font-medium text-[oklch(0.5_0.012_255)]">
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
