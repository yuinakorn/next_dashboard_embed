import { AppNavbar } from "@/components/app-navbar";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { buttonStyles } from "@/components/dashboard-ui";
import { hasPermission } from "@/lib/permissions";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireCurrentUser();
  const userStatus = currentUser.status ?? "active";
  const canReadAudit = hasPermission(currentUser, "audit:read");
  const navItems =
    userStatus === "active"
      ? [
          { label: "หน้าหลัก", href: "/" },
          { label: "รายงาน", href: "/catalog" },
          ...(canReadAudit ? [{ label: "ประวัติ Audit", href: "/audit" }] : []),
        ]
      : [{ label: "ขอสิทธิ์ใช้งาน", href: "/access-request" }];
  const extraNavItems =
    userStatus === "active"
      ? [
          ...(hasPermission(currentUser, "permission:manage")
            ? [{ label: "ผู้ใช้งาน", href: "/admin/users" }]
            : []),
          ...(hasPermission(currentUser, "category:update") ||
          hasPermission(currentUser, "category:create_root") ||
          hasPermission(currentUser, "category:create_child")
            ? [{ label: "หมวดรายงาน", href: "/admin/categories" }]
            : []),
        ]
      : [];

  return (
    <>
      <AppNavbar
        userName={currentUser.name}
        userTitle={
          currentUser.impersonatedBy
            ? `สลับจาก ${currentUser.impersonatedBy.name} · ${currentUser.title} · ${currentUser.department}`
            : `${currentUser.title} · ${currentUser.department}`
        }
        navItems={navItems}
        extraNavItems={extraNavItems}
        actions={
          <div className="flex items-center gap-2">
            {currentUser.impersonatedBy ? (
              <a
                href="/api/admin/impersonation/stop"
                className={`${buttonStyles.primary} h-9 px-3 text-xs`}
              >
                กลับเป็นตัวเอง
              </a>
            ) : null}
            <a
              href="/api/auth/logout"
              className={`${buttonStyles.secondary} h-9 px-3 text-xs`}
            >
              ออกจากระบบ
            </a>
          </div>
        }
      />
      {children}
    </>
  );
}
