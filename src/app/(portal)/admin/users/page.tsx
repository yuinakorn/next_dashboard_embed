import { notFound } from "next/navigation";
import { flattenCategories } from "@/lib/category-utils";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listCategories } from "@/lib/db/categories";
import { allPortalRoles, listAccessRequests, listManagedUsers, listTeams } from "@/lib/db/users";
import { hasPermission } from "@/lib/permissions";
import { PageHeader } from "@/components/dashboard-ui";
import { UserPermissionManager } from "./user-permission-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentUser = await requireCurrentUser();

  if (!hasPermission(currentUser, "permission:manage")) {
    notFound();
  }

  const [users, teams, categories, accessRequests] = await Promise.all([
    listManagedUsers(),
    listTeams(),
    listCategories(),
    listAccessRequests(),
  ]);

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="Admin"
        title="จัดการผู้ใช้และสิทธิ์"
        description="กำหนด role และ category scope สำหรับ Dashboard Hub พร้อมบันทึก audit log"
        actions={[
          { href: "/audit", label: "Audit log" },
          { href: "/", label: "หน้าหลัก", primary: true },
        ]}
      />

      <div className="mx-auto max-w-7xl px-5 py-6">
        <UserPermissionManager
          users={users}
          teams={teams}
          roles={allPortalRoles()}
          categories={flattenCategories(categories)}
          accessRequests={accessRequests}
        />
      </div>
    </main>
  );
}
