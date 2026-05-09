"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge, TableShell, buttonStyles } from "@/components/dashboard-ui";
import type { CategoryOption } from "@/lib/category-utils";
import type { PortalRole } from "@/lib/portal-types";
import type { ManagedPortalUser, PortalTeam } from "@/lib/db/users";

type UserPermissionManagerProps = {
  users: ManagedPortalUser[];
  teams: PortalTeam[];
  roles: PortalRole[];
  categories: CategoryOption[];
};

const roleLabels: Record<PortalRole, string> = {
  system_admin: "System admin",
  category_admin: "Category admin",
  project_manager: "Project manager",
  editor: "Editor",
  viewer: "Viewer",
};

const roleTone: Record<PortalRole, string> = {
  system_admin: "bg-slate-900 text-slate-50",
  category_admin: "bg-sky-50 text-sky-800",
  project_manager: "bg-violet-50 text-violet-800",
  editor: "bg-amber-50 text-amber-900",
  viewer: "bg-slate-100 text-slate-700",
};

function scopedCategoryIds(user: ManagedPortalUser) {
  return user.scopes.flatMap((scope) => scope.categoryIds);
}

export function UserPermissionManager({
  users,
  teams,
  roles,
  categories,
}: UserPermissionManagerProps) {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const [roleDraft, setRoleDraft] = useState<PortalRole[]>(selectedUser?.roles ?? ["viewer"]);
  const [scopeDraft, setScopeDraft] = useState<string[]>(selectedUser ? scopedCategoryIds(selectedUser) : []);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const teamNames = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams],
  );

  function selectUser(user: ManagedPortalUser) {
    setSelectedUserId(user.id);
    setRoleDraft(user.roles);
    setScopeDraft(scopedCategoryIds(user));
    setMessage(null);
  }

  function toggleRole(role: PortalRole) {
    setRoleDraft((current) => {
      const next = current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role];

      return next.length ? next : ["viewer"];
    });
  }

  function toggleScope(categoryId: string) {
    setScopeDraft((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  }

  function savePermissions() {
    if (!selectedUser) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: roleDraft, categoryIds: scopeDraft }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "ไม่สามารถบันทึกสิทธิ์ได้");
        return;
      }

      setMessage("บันทึกสิทธิ์แล้ว รีเฟรชหน้าเพื่อดูข้อมูลล่าสุด");
    });
  }

  function startImpersonation() {
    if (!selectedUser) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          roles: roleDraft,
          categoryIds: scopeDraft,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "ไม่สามารถสลับตัวตนได้");
        return;
      }

      window.location.href = "/";
    });
  }

  if (!users.length) {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        ยังไม่มีผู้ใช้ในระบบ ผู้ใช้ SSO จะถูกเพิ่มหลังเข้าสู่ระบบสำเร็จ
      </section>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <TableShell
        title="ผู้ใช้ในระบบ"
        description="รายการนี้มาจากผู้ใช้ seed และผู้ใช้ที่ login ผ่าน SSO สำเร็จ"
      >
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">ผู้ใช้</th>
              <th className="px-4 py-3 font-semibold">ทีม</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Scope</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className={user.id === selectedUser?.id ? "bg-sky-50/50" : "bg-slate-50"}>
                <td className="px-4 py-4 align-top">
                  <p className="font-semibold text-slate-950">{user.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{user.title}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">{user.id}</p>
                </td>
                <td className="px-4 py-4 align-top text-slate-600">
                  <p>{teamNames.get(user.teamId) ?? user.teamId}</p>
                  <p className="mt-1 text-xs text-slate-400">{user.source}</p>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} className={roleTone[role]}>
                        {roleLabels[role]}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-slate-600">
                  {scopedCategoryIds(user).length || "All public / team defaults"}
                </td>
                <td className="px-4 py-4 align-top">
                  <button
                    type="button"
                    className={`${buttonStyles.secondary} h-9`}
                    onClick={() => selectUser(user)}
                  >
                    แก้สิทธิ์
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
        {selectedUser ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Permission editor
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">{selectedUser.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{selectedUser.department}</p>

            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="text-sm font-semibold text-slate-900">Roles</legend>
                <div className="mt-3 grid gap-2">
                  {roles.map((role) => (
                    <label key={role} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={roleDraft.includes(role)}
                        onChange={() => toggleRole(role)}
                      />
                      {roleLabels[role]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-900">Category scope</legend>
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-3">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-start gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300"
                        checked={scopeDraft.includes(category.id)}
                        onChange={() => toggleScope(category.id)}
                      />
                      <span style={{ paddingLeft: category.depth * 12 }}>
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {message ? (
                <div className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  {message}
                </div>
              ) : null}

              <button
                type="button"
                className={`${buttonStyles.primary} h-10 w-full justify-center`}
                disabled={isPending}
                onClick={savePermissions}
              >
                {isPending ? "กำลังบันทึก" : "บันทึกสิทธิ์"}
              </button>

              <button
                type="button"
                className={`${buttonStyles.secondary} h-10 w-full justify-center`}
                disabled={isPending}
                onClick={startImpersonation}
              >
                สลับเป็น user/role นี้
              </button>

              <p className="text-xs leading-5 text-slate-500">
                ปุ่มสลับตัวตนเป็นโหมดชั่วคราว ไม่เขียน role/scope ลงฐานข้อมูล
                ส่วนการบันทึกสิทธิ์จะสร้าง audit log action permission.update
              </p>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}
