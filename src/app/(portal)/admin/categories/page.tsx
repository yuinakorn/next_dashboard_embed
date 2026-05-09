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
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="Admin"
        title="จัดการหมวดหมู่"
        description="ดูแล category tree, owner team, sort order และสถานะการใช้งานของ Dashboard Hub"
        actions={[
          { href: "/admin/users", label: "Users" },
          { href: "/audit", label: "Audit log" },
          { href: "/", label: "หน้าหลัก", primary: true },
        ]}
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
