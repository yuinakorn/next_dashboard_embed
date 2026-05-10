import { PageHeader } from "@/components/dashboard-ui";
import { flattenCategories } from "@/lib/category-utils";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listCategories } from "@/lib/db/categories";
import { allPortalRoles, listAccessRequestsForUser } from "@/lib/db/users";
import { AccessRequestForm } from "./access-request-form";

export const dynamic = "force-dynamic";

export default async function AccessRequestPage() {
  const currentUser = await requireCurrentUser();
  const [categories, requests] = await Promise.all([
    listCategories(),
    listAccessRequestsForUser(currentUser.id),
  ]);
  const userStatus = currentUser.status ?? "active";

  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <PageHeader
        eyebrow="Access"
        title={userStatus === "pending" ? "บัญชีกำลังรออนุมัติ" : "ขอสิทธิ์เพิ่มเติม"}
        description={
          userStatus === "suspended"
            ? "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ"
            : "ส่งคำขอเพื่อให้ผู้ดูแลระบบกำหนดบทบาทและขอบเขตหมวดรายงานที่เกี่ยวข้อง"
        }
        actions={[{ href: "/", label: "หน้าหลัก", primary: true }]}
      />
      <div className="mx-auto max-w-7xl px-5 py-6">
        {userStatus === "suspended" ? (
          <section className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-900">
            <h2 className="text-lg font-semibold">บัญชีถูกระงับ</h2>
            <p className="mt-2 text-sm leading-6">
              หากต้องการกลับมาใช้งาน กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์ใหม่
            </p>
          </section>
        ) : (
          <AccessRequestForm
            categories={flattenCategories(categories)}
            roles={allPortalRoles()}
            currentRoles={currentUser.roles}
            requests={requests}
          />
        )}
      </div>
    </main>
  );
}
