import Link from "next/link";
import { flattenCategories } from "@/lib/category-utils";
import { mockCategories, mockCurrentUser } from "@/lib/mock-portal-data";
import { canCreateDashboard, getUserPermissions } from "@/lib/permissions";
import { NewDashboardForm } from "./new-dashboard-form";

export default function NewDashboardPage() {
  const permissions = getUserPermissions(mockCurrentUser);
  const categoryOptions = flattenCategories(mockCategories).filter((category) =>
    canCreateDashboard(mockCurrentUser, category.id),
  );

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Mock create flow</p>
            <h1 className="mt-1 text-2xl font-semibold">New Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/catalog"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back to catalog
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-6 lg:grid-cols-[1fr_280px]">
        <NewDashboardForm categoryOptions={categoryOptions} />

        <aside className="space-y-4">
          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-950">Current user</h2>
            <p className="mt-2 text-sm text-zinc-600">{mockCurrentUser.name}</p>
            <p className="mt-1 text-sm text-zinc-500">{mockCurrentUser.department}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {mockCurrentUser.roles.map((role) => (
                <span key={role} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                  {role}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-950">Allowed categories</h2>
            <div className="mt-3 space-y-2">
              {categoryOptions.map((category) => (
                <div key={category.id} className="rounded-md border border-zinc-200 px-3 py-2 text-sm">
                  {"- ".repeat(category.depth)}
                  {category.name}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-950">Permission snapshot</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span key={permission} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
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
