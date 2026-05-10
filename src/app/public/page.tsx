import { buttonStyles } from "@/components/dashboard-ui";
import { listPortalCategories } from "@/lib/db/categories";
import { listPublishedDashboardsForPortal } from "@/lib/db/dashboards";
import Link from "next/link";
import { CategoryGrid, PublicSignalPreview, visibleCategoryRoots } from "./public-ui";

export const dynamic = "force-dynamic";

export default async function PublicHome() {
  const [categories, publishedDashboards] = await Promise.all([
    listPortalCategories(),
    listPublishedDashboardsForPortal(),
  ]);
  const categoryRoots = visibleCategoryRoots(categories);
  const publicCount = publishedDashboards.filter((dashboard) => dashboard.sensitivity === "public").length;
  const loginRequiredCount = publishedDashboards.length - publicCount;
  const featuredDashboard =
    publishedDashboards.find((dashboard) => dashboard.isPinned && dashboard.sensitivity === "public") ??
    publishedDashboards.find((dashboard) => dashboard.sensitivity === "public") ??
    publishedDashboards[0];

  return (
    <>
      <section className="border-b border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:py-10">
          <div>
            <p className="text-sm font-semibold text-[oklch(0.4_0.13_260)]">รายงานสุขภาพจังหวัดเชียงใหม่</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[oklch(0.21_0.015_255)]">
              ค้นหาและเปิดดูรายงาน dashboard ตามหมวดสาธารณสุข
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[oklch(0.5_0.012_255)]">
              แสดงรายงานที่เผยแพร่แล้ว พร้อมแยกรายงานสาธารณะและรายงานที่ต้องเข้าสู่ระบบ
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/public/reports" className={`${buttonStyles.primary} h-11 justify-center`}>
                ดูรายการข้อมูล
              </Link>
              <Link href="/" className={`${buttonStyles.secondary} h-11 justify-center`}>
                เจ้าหน้าที่เข้าสู่ระบบ
              </Link>
            </div>
          </div>
          <PublicSignalPreview
            dashboard={featuredDashboard}
            reportCount={publishedDashboards.length}
            publicCount={publicCount}
            loginRequiredCount={loginRequiredCount}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[oklch(0.21_0.015_255)]">หมวดรายงาน</h2>
            <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">
              เลือกหมวดเพื่อดูหมวดย่อยและรายงานในกลุ่มนั้น
            </p>
          </div>
          <Link href="/public/reports" className="text-sm font-semibold text-[oklch(0.4_0.13_260)] hover:text-[oklch(0.25_0.09_262)]">
            ดูรายงานทั้งหมด
          </Link>
        </div>
        <div className="mt-4">
          <CategoryGrid categories={categoryRoots} limit={8} />
        </div>
      </section>
    </>
  );
}
