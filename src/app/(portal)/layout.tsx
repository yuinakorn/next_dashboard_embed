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
  const extraNavItems = [
    ...(hasPermission(currentUser, "permission:manage")
      ? [{ label: "Users", href: "/admin/users" }]
      : []),
    ...(hasPermission(currentUser, "category:update") ||
    hasPermission(currentUser, "category:create_root") ||
    hasPermission(currentUser, "category:create_child")
      ? [{ label: "Categories", href: "/admin/categories" }]
      : []),
  ];

  return (
    <>
      <AppNavbar
        userName={currentUser.name}
        userTitle={`${currentUser.title} · ${currentUser.department}`}
        extraNavItems={extraNavItems}
        actions={
          <a
            href="/api/auth/logout"
            className={`${buttonStyles.secondary} h-9 px-3 text-xs`}
          >
            ออกจากระบบ
          </a>
        }
      />
      {children}
    </>
  );
}
