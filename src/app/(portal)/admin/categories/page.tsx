import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listManagedCategories } from "@/lib/db/categories";
import { listTeams } from "@/lib/db/users";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/dashboard-ui";
import { CategoryManager } from "./category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const currentUser = await requireCurrentUser();
  const canUseCategoryAdmin =
    hasPermission(currentUser, "category:create_root") ||
    hasPermission(currentUser, "category:create_child") ||
    hasPermission(currentUser, "category:update");

  if (!canUseCategoryAdmin) {
    notFound();
  }

  const [categories, teams] = await Promise.all([
    listManagedCategories(),
    listTeams(),
  ]);

  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <PageHeader
        eyebrow="ดูแลระบบ"
        title="จัดการหมวดรายงาน"
        description="ดูแลโครงสร้างหมวดรายงานแบบหลายชั้น เจ้าของหมวด ลำดับแสดงผล และสถานะการใช้งาน"
        maxWidth="max-w-7xl"
      />

      <div className="mx-auto max-w-7xl px-5 py-6">
        <CategoryManager
          initialCategories={categories}
          teams={teams}
          canCreateRoot={hasPermission(currentUser, "category:create_root")}
        />
      </div>
    </main>
  );
}
