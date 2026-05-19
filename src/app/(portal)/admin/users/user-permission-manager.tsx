"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge, TableShell, buttonStyles } from "@/components/dashboard-ui";
import type { CategoryOption } from "@/lib/category-utils";
import type { AccessRequestStatus, PortalRole } from "@/lib/portal-types";
import type { AccessRequest, ManagedPortalUser, PortalTeam } from "@/lib/db/users";

type UserPermissionManagerProps = {
  users: ManagedPortalUser[];
  teams: PortalTeam[];
  roles: PortalRole[];
  categories: CategoryOption[];
  accessRequests: AccessRequest[];
};

const roleLabels: Record<PortalRole, string> = {
  system_admin: "System admin",
  category_admin: "Category admin",
  project_manager: "Project manager",
  editor: "Editor",
  viewer: "Viewer",
};

const roleTone: Record<PortalRole, string> = {
  system_admin: "bg-[oklch(0.21_0.015_255)] text-[oklch(0.998_0.002_250)]",
  category_admin: "bg-[oklch(0.978_0.012_258)] text-[oklch(0.4_0.13_260)]",
  project_manager: "bg-violet-50 text-violet-800",
  editor: "bg-amber-50 text-amber-900",
  viewer: "bg-[oklch(0.955_0.005_250)] text-[oklch(0.3_0.018_255)]",
};

const userStatusLabels = {
  pending: "รอเปิดใช้งาน",
  active: "ใช้งานได้",
  suspended: "ระงับ",
};

const requestStatusLabels: Record<AccessRequestStatus, string> = {
  pending: "รอตรวจคำขอ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  cancelled: "ยกเลิก",
};

type ApprovalQueueItem =
  | {
      id: string;
      kind: "access_request";
      request: AccessRequest;
      user: ManagedPortalUser | undefined;
    }
  | {
      id: string;
      kind: "new_user";
      user: ManagedPortalUser;
    };

function scopedCategoryIds(user: ManagedPortalUser) {
  return user.scopes.flatMap((scope) => scope.categoryIds);
}

export function UserPermissionManager({
  users,
  teams,
  roles,
  categories,
  accessRequests,
}: UserPermissionManagerProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUser = selectedUserId
    ? users.find((user) => user.id === selectedUserId) ?? null
    : null;
  const [roleDraft, setRoleDraft] = useState<PortalRole[]>(["viewer"]);
  const [scopeDraft, setScopeDraft] = useState<string[]>([]);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [suspendTarget, setSuspendTarget] = useState<{ userId: string; reason: string } | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ requestId: string; decision: "approve" | "reject"; note: string } | null>(null);
  const teamNames = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams],
  );
  const allCategoryIds = useMemo(() => categories.map((category) => category.id), [categories]);
  const rootCategoryIds = useMemo(
    () => categories.filter((category) => category.depth === 0).map((category) => category.id),
    [categories],
  );
  const teamCategoryIds = useMemo(
    () =>
      selectedUser
        ? categories
            .filter((category) => category.ownerTeamId === selectedUser.teamId)
            .map((category) => category.id)
        : [],
    [categories, selectedUser],
  );
  const filteredCategories = useMemo(() => {
    const normalizedQuery = categoryQuery.trim().toLocaleLowerCase("th-TH");

    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) =>
      category.name.toLocaleLowerCase("th-TH").includes(normalizedQuery),
    );
  }, [categories, categoryQuery]);
  const approvalQueue = useMemo<ApprovalQueueItem[]>(() => {
    const pendingRequests = accessRequests.filter((request) => request.status === "pending");
    const usersById = new Map(users.map((user) => [user.id, user]));
    const requestUserIds = new Set(pendingRequests.map((request) => request.userId));
    const requestItems: ApprovalQueueItem[] = pendingRequests.map((request) => ({
      id: request.id,
      kind: "access_request",
      request,
      user: usersById.get(request.userId),
    }));
    const newUserItems: ApprovalQueueItem[] = users
      .filter((user) => (user.status ?? "active") === "pending" && !requestUserIds.has(user.id))
      .map((user) => ({
        id: `new-user-${user.id}`,
        kind: "new_user",
        user,
      }));

    return [...requestItems, ...newUserItems];
  }, [accessRequests, users]);
  const queuedUserIds = useMemo(
    () =>
      new Set(
        approvalQueue.map((item) =>
          item.kind === "access_request" ? item.request.userId : item.user.id,
        ),
      ),
    [approvalQueue],
  );

  function selectUser(user: ManagedPortalUser) {
    setSelectedUserId(user.id);
    setRoleDraft(user.roles);
    setScopeDraft(scopedCategoryIds(user));
    setCategoryQuery("");
    setMessage(null);
    setIsConfirmingDelete(false);
  }

  function closePermissionEditor() {
    setSelectedUserId(null);
    setMessage(null);
    setIsConfirmingDelete(false);
  }

  function toggleRole(role: PortalRole) {
    setRoleDraft((current) => {
      const next = current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role];

      return next.length ? next : ["viewer"];
    });
  }

  function categoryBranchIds(category: CategoryOption) {
    const startIndex = categories.findIndex((item) => item.id === category.id);

    if (startIndex < 0) {
      return [category.id];
    }

    const branch: string[] = [];

    for (let index = startIndex; index < categories.length; index += 1) {
      const candidate = categories[index];

      if (index !== startIndex && candidate.depth <= category.depth) {
        break;
      }

      branch.push(candidate.id);
    }

    return branch;
  }

  function replaceScope(nextCategoryIds: string[]) {
    const allowedCategoryIds = new Set(allCategoryIds);
    const next = Array.from(new Set(nextCategoryIds)).filter((categoryId) =>
      allowedCategoryIds.has(categoryId),
    );

    setScopeDraft(next);
  }

  function setScopePreset(categoryIds: string[]) {
    replaceScope(categoryIds);
  }

  function toggleScopeBranch(category: CategoryOption) {
    const branchIds = categoryBranchIds(category);

    setScopeDraft((current) =>
      branchIds.every((categoryId) => current.includes(categoryId))
        ? current.filter((categoryId) => !branchIds.includes(categoryId))
        : Array.from(new Set([...current, ...branchIds])),
    );
  }

  function getBranchState(category: CategoryOption) {
    const branchIds = categoryBranchIds(category);
    const selectedCount = branchIds.filter((categoryId) => scopeDraft.includes(categoryId)).length;

    return {
      isSelected: selectedCount === branchIds.length,
      isPartial: selectedCount > 0 && selectedCount < branchIds.length,
      total: branchIds.length,
    };
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
        body: JSON.stringify({
          roles: roleDraft,
          categoryIds: scopeDraft,
          activate: (selectedUser.status ?? "active") === "pending",
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "ไม่สามารถบันทึกสิทธิ์ได้");
        return;
      }

      window.location.reload();
    });
  }

  function activateAsViewer(user: ManagedPortalUser) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: ["viewer"], categoryIds: [], activate: true }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "ไม่สามารถเปิดใช้งานผู้ใช้ได้");
        return;
      }

      window.location.reload();
    });
  }

  function startSuspend(user: ManagedPortalUser) {
    setSuspendTarget({ userId: user.id, reason: "" });
    setMessage(null);
  }

  function confirmSuspend() {
    if (!suspendTarget) return;
    if (suspendTarget.reason.trim().length < 10) {
      setMessage("กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${suspendTarget.userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "suspended", disabledReason: suspendTarget.reason }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "ไม่สามารถระงับผู้ใช้ได้");
        return;
      }
      window.location.reload();
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

  function startReview(requestId: string, decision: "approve" | "reject") {
    setReviewTarget({ requestId, decision, note: decision === "approve" ? "อนุมัติสิทธิ์ตามคำขอ" : "" });
    setMessage(null);
  }

  function confirmReview() {
    if (!reviewTarget) return;
    if (reviewTarget.decision === "reject" && reviewTarget.note.trim().length < 10) {
      setMessage("กรุณาระบุเหตุผลเมื่อปฏิเสธคำขอ (อย่างน้อย 10 ตัวอักษร)");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/access-requests/${reviewTarget.requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: reviewTarget.decision, note: reviewTarget.note }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "ไม่สามารถดำเนินการคำขอได้");
        return;
      }
      window.location.reload();
    });
  }

  function deleteUser() {
    if (!selectedUser) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "ไม่สามารถลบผู้ใช้ได้");
        setIsConfirmingDelete(false);
        return;
      }

      window.location.reload();
    });
  }

  if (!users.length) {
    return (
      <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-6 text-sm text-[oklch(0.5_0.012_255)]">
        ยังไม่มีผู้ใช้ในระบบ ผู้ใช้ SSO จะถูกเพิ่มหลังเข้าสู่ระบบสำเร็จ
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <TableShell
        title="คิวอนุมัติ"
        description="งานที่ต้องตัดสินใจตอนนี้: ผู้ใช้ใหม่จาก SSO และคำขอ role/scope ที่รอตรวจ"
      >
        <table className="min-w-full divide-y divide-[oklch(0.91_0.006_250)] text-sm">
          <thead className="bg-[oklch(0.955_0.005_250)] text-left text-xs uppercase tracking-[0.08em] text-[oklch(0.5_0.012_255)]">
            <tr>
              <th className="px-4 py-3 font-semibold">ประเภท</th>
              <th className="px-4 py-3 font-semibold">ผู้ใช้</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Scope</th>
              <th className="px-4 py-3 font-semibold">สถานะ</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[oklch(0.91_0.006_250)]">
            {approvalQueue.length ? (
              approvalQueue.slice(0, 20).map((item) => {
                if (item.kind === "access_request") {
                  const request = item.request;
                  const user = item.user;

                  return (
                    <tr key={item.id} className="bg-amber-50/40">
                      <td className="px-4 py-4 align-top">
                        <Badge className="bg-amber-100 text-amber-900">คำขอสิทธิ์</Badge>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-[oklch(0.21_0.015_255)]">{request.userName}</p>
                        <p className="mt-1 text-xs text-[oklch(0.5_0.012_255)]">{request.userDepartment}</p>
                        {user ? (
                          <p className="mt-1 text-xs font-semibold text-[oklch(0.5_0.012_255)]">
                            บัญชี: {userStatusLabels[user.status ?? "active"]}
                          </p>
                        ) : null}
                        <p className="mt-2 line-clamp-2 max-w-xs text-xs leading-5 text-[oklch(0.5_0.012_255)]">
                          {request.reason}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-1">
                          {request.requestedRoles.map((role) => (
                            <Badge key={role} className={roleTone[role]}>
                              {roleLabels[role]}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-[oklch(0.5_0.012_255)]">
                        {request.requestedCategoryIds.length
                          ? `${request.requestedCategoryIds.length} หมวด`
                          : "All public / team defaults"}
                      </td>
                      <td className="px-4 py-4 align-top font-semibold text-amber-900">
                        {requestStatusLabels[request.status]}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {reviewTarget?.requestId === request.id ? (
                          <div className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-3">
                            <p className="text-xs font-semibold text-[oklch(0.21_0.015_255)]">
                              {reviewTarget.decision === "approve" ? "ยืนยันอนุมัติคำขอ?" : "ระบุเหตุผลที่ปฏิเสธ"}
                            </p>
                            <input
                              type="text"
                              className="mt-2 h-9 w-full rounded-md border border-[oklch(0.85_0.008_250)] bg-white px-3 text-sm outline-none focus:border-[oklch(0.5_0.14_258)] focus:ring-2 focus:ring-[oklch(0.95_0.028_258)]"
                              placeholder={reviewTarget.decision === "approve" ? "หมายเหตุ (ไม่บังคับ)" : "เหตุผล (อย่างน้อย 10 ตัวอักษร)"}
                              value={reviewTarget.note}
                              onChange={(e) => setReviewTarget((prev) => prev ? { ...prev, note: e.target.value } : null)}
                            />
                            <div className="mt-2 flex gap-2">
                              <button type="button" className={`${buttonStyles.primary} h-8 px-3 text-xs`} disabled={isPending} onClick={confirmReview}>
                                ยืนยัน
                              </button>
                              <button type="button" className={`${buttonStyles.secondary} h-8 px-3 text-xs`} disabled={isPending} onClick={() => setReviewTarget(null)}>
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={`${buttonStyles.primary} h-9 px-3`}
                              disabled={isPending}
                              onClick={() => startReview(request.id, "approve")}
                            >
                              อนุมัติ
                            </button>
                            <button
                              type="button"
                              className={`${buttonStyles.secondary} h-9 px-3`}
                              disabled={isPending}
                              onClick={() => startReview(request.id, "reject")}
                            >
                              ปฏิเสธ
                            </button>
                            {user ? (
                              <button
                                type="button"
                                className={`${buttonStyles.secondary} h-9 px-3`}
                                onClick={() => selectUser(user)}
                              >
                                กำหนดเอง
                              </button>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }

                const user = item.user;

                return (
                  <tr key={item.id} className="bg-[oklch(0.978_0.012_258)]/40">
                    <td className="px-4 py-4 align-top">
                      <Badge className="bg-[oklch(0.95_0.028_258)] text-[oklch(0.32_0.11_262)]">ผู้ใช้ใหม่</Badge>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-[oklch(0.21_0.015_255)]">{user.name}</p>
                      <p className="mt-1 text-xs text-[oklch(0.5_0.012_255)]">{teamNames.get(user.teamId) ?? user.department}</p>
                      <p className="mt-1 font-mono text-xs text-[oklch(0.66_0.01_255)]">{user.id}</p>
                      <p className="mt-2 max-w-xs text-xs leading-5 text-[oklch(0.5_0.012_255)]">
                        Login ผ่าน SSO แล้ว แต่ยังไม่ได้ส่งคำขอ role/scope
                      </p>
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
                    <td className="px-4 py-4 align-top text-[oklch(0.5_0.012_255)]">
                      {scopedCategoryIds(user).length
                        ? `${scopedCategoryIds(user).length} หมวด`
                        : "All public / team defaults"}
                    </td>
                    <td className="px-4 py-4 align-top font-semibold text-[oklch(0.32_0.11_262)]">
                      {userStatusLabels[user.status ?? "active"]}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`${buttonStyles.primary} h-9 px-3`}
                          disabled={isPending}
                          onClick={() => activateAsViewer(user)}
                        >
                          เปิดเป็น Viewer
                        </button>
                        <button
                          type="button"
                          className={`${buttonStyles.secondary} h-9 px-3`}
                          disabled={isPending}
                          onClick={() => selectUser(user)}
                        >
                          กำหนดสิทธิ์
                        </button>
                        {suspendTarget?.userId === user.id ? (
                          <div className="rounded-lg border border-[oklch(0.88_0.04_25)] bg-[oklch(0.98_0.012_25)] p-3">
                            <p className="text-xs font-semibold text-[oklch(0.42_0.13_25)]">ระบุเหตุผลที่ระงับ</p>
                            <input
                              type="text"
                              className="mt-2 h-9 w-full rounded-md border border-[oklch(0.85_0.06_25)] bg-white px-3 text-sm outline-none focus:border-[oklch(0.5_0.14_258)] focus:ring-2 focus:ring-[oklch(0.95_0.028_258)]"
                              placeholder="เหตุผล (อย่างน้อย 10 ตัวอักษร)"
                              value={suspendTarget.reason}
                              onChange={(e) => setSuspendTarget((prev) => prev ? { ...prev, reason: e.target.value } : null)}
                            />
                            <div className="mt-2 flex gap-2">
                              <button type="button" className={`${buttonStyles.danger} h-8 px-3 text-xs`} disabled={isPending} onClick={confirmSuspend}>
                                ยืนยันระงับ
                              </button>
                              <button type="button" className={`${buttonStyles.secondary} h-8 px-3 text-xs`} disabled={isPending} onClick={() => setSuspendTarget(null)}>
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={`${buttonStyles.danger} h-9 px-3`}
                            disabled={isPending}
                            onClick={() => startSuspend(user)}
                          >
                            ระงับ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="bg-[oklch(0.998_0.002_250)]">
                <td colSpan={6} className="px-4 py-6 text-center text-[oklch(0.5_0.012_255)]">
                  ไม่มีงานรออนุมัติ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableShell>

      <TableShell
        title="ผู้ใช้ในระบบ"
        description="รายการนี้มาจากผู้ใช้ seed และผู้ใช้ที่ login ผ่าน SSO สำเร็จ"
      >
        <table className="min-w-full divide-y divide-[oklch(0.91_0.006_250)] text-sm">
          <thead className="bg-[oklch(0.955_0.005_250)] text-left text-xs uppercase tracking-[0.08em] text-[oklch(0.5_0.012_255)]">
            <tr>
              <th className="px-4 py-3 font-semibold">ผู้ใช้</th>
              <th className="px-4 py-3 font-semibold">ทีม</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Scope</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[oklch(0.91_0.006_250)]">
            {users.map((user) => (
              <tr key={user.id} className={user.id === selectedUser?.id ? "bg-[oklch(0.978_0.012_258)]/50" : "bg-[oklch(0.998_0.002_250)]"}>
                <td className="px-4 py-4 align-top">
                  <p className="font-semibold text-[oklch(0.21_0.015_255)]">{user.name}</p>
                  <p className="mt-1 text-xs text-[oklch(0.5_0.012_255)]">{user.title}</p>
                  <p className="mt-1 font-mono text-xs text-[oklch(0.66_0.01_255)]">{user.id}</p>
                </td>
                <td className="px-4 py-4 align-top text-[oklch(0.5_0.012_255)]">
                  <p>{teamNames.get(user.teamId) ?? user.teamId}</p>
                  <p className="mt-1 text-xs text-[oklch(0.66_0.01_255)]">{user.source}</p>
                  <p className="mt-1 text-xs font-semibold text-[oklch(0.5_0.012_255)]">
                    {userStatusLabels[user.status ?? "active"]}
                  </p>
                  {queuedUserIds.has(user.id) ? (
                    <p className="mt-1 text-xs font-semibold text-amber-800">อยู่ในคิวอนุมัติ</p>
                  ) : null}
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
                <td className="px-4 py-4 align-top text-[oklch(0.5_0.012_255)]">
                  {scopedCategoryIds(user).length || "All public / team defaults"}
                </td>
                <td className="px-4 py-4 align-top">
                  <button
                    type="button"
                    className={`${buttonStyles.secondary} h-9`}
                    onClick={() => selectUser(user)}
                  >
                    {queuedUserIds.has(user.id) ? "กำหนดสิทธิ์" : "แก้สิทธิ์"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[oklch(0.21_0.015_255)]/25">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="ปิดตัวแก้สิทธิ์"
            onClick={closePermissionEditor}
          />
          <aside className="relative flex h-full w-full max-w-xl flex-col border-l border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] shadow-2xl">
            <div className="border-b border-[oklch(0.91_0.006_250)] bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[oklch(0.66_0.01_255)]">
                    Permission editor
                  </p>
                  <h2 className="mt-2 truncate text-xl font-semibold text-[oklch(0.21_0.015_255)]">
                    {selectedUser.name}
                  </h2>
                  <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">{selectedUser.department}</p>
                </div>
                <button
                  type="button"
                  className={`${buttonStyles.secondary} h-9 px-3`}
                  onClick={closePermissionEditor}
                >
                  ปิด
                </button>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-[oklch(0.5_0.012_255)] sm:grid-cols-3">
                <div className="rounded-md border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-3">
                  <p className="text-xs font-semibold text-[oklch(0.66_0.01_255)]">สถานะบัญชี</p>
                  <p className="mt-1 font-semibold text-[oklch(0.3_0.018_255)]">
                    {userStatusLabels[selectedUser.status ?? "active"]}
                  </p>
                </div>
                <div className="rounded-md border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-3">
                  <p className="text-xs font-semibold text-[oklch(0.66_0.01_255)]">แหล่งที่มา</p>
                  <p className="mt-1 font-semibold text-[oklch(0.3_0.018_255)]">{selectedUser.source}</p>
                </div>
                <div className="rounded-md border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-3">
                  <p className="text-xs font-semibold text-[oklch(0.66_0.01_255)]">Scope</p>
                  <p className="mt-1 font-semibold text-[oklch(0.3_0.018_255)]">
                    {scopeDraft.length ? `${scopeDraft.length} หมวด` : "Default"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section>
                <h3 className="text-sm font-semibold text-[oklch(0.21_0.015_255)]">Roles</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {roles.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 rounded-md border border-[oklch(0.91_0.006_250)] bg-white px-3 py-2 text-sm text-[oklch(0.3_0.018_255)]"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[oklch(0.85_0.008_250)]"
                        checked={roleDraft.includes(role)}
                        onChange={() => toggleRole(role)}
                      />
                      {roleLabels[role]}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-end justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[oklch(0.21_0.015_255)]">Category scope</h3>
                  <span className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">
                    {scopeDraft.length ? `${scopeDraft.length} / ${categories.length} หมวด` : "ใช้ค่า default"}
                  </span>
                </div>

                <div className="mt-3 rounded-md border border-[oklch(0.91_0.006_250)] bg-white">
                  <div className="space-y-3 border-b border-[oklch(0.91_0.006_250)] p-3">
                    <input
                      type="search"
                      className="h-9 w-full rounded-md border border-[oklch(0.85_0.008_250)] bg-[oklch(0.998_0.002_250)] px-3 text-sm outline-none transition duration-200 placeholder:text-[oklch(0.66_0.01_255)] focus:border-[oklch(0.4_0.13_260)] focus:ring-2 focus:ring-[oklch(0.95_0.028_258)]"
                      value={categoryQuery}
                      onChange={(event) => setCategoryQuery(event.target.value)}
                      placeholder="ค้นหาหมวดรายงาน"
                    />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <button
                        type="button"
                        className={`${buttonStyles.secondary} h-8 justify-center px-2 text-xs`}
                        onClick={() => setScopePreset(allCategoryIds)}
                      >
                        เลือกทั้งหมด
                      </button>
                      <button
                        type="button"
                        className={`${buttonStyles.secondary} h-8 justify-center px-2 text-xs`}
                        onClick={() => setScopePreset(teamCategoryIds)}
                      >
                        เฉพาะทีม
                      </button>
                      <button
                        type="button"
                        className={`${buttonStyles.secondary} h-8 justify-center px-2 text-xs`}
                        onClick={() => setScopePreset(rootCategoryIds)}
                      >
                        หมวดหลัก
                      </button>
                      <button
                        type="button"
                        className={`${buttonStyles.secondary} h-8 justify-center px-2 text-xs`}
                        onClick={() => setScopePreset([])}
                      >
                        ล้าง
                      </button>
                    </div>
                    <p className="text-xs leading-5 text-[oklch(0.5_0.012_255)]">
                      เลือกหมวดแม่เพื่อรวมหมวดย่อยทั้งหมดในสาขานั้น
                    </p>
                  </div>

                  <div className="max-h-[42vh] space-y-1 overflow-y-auto p-2">
                    {filteredCategories.length ? (
                      filteredCategories.map((category) => {
                        const branchState = getBranchState(category);

                        return (
                          <label
                            key={category.id}
                            className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-[oklch(0.3_0.018_255)] transition duration-200 hover:bg-[oklch(0.998_0.002_250)] ${
                              branchState.isPartial ? "bg-amber-50/60" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 rounded border-[oklch(0.85_0.008_250)]"
                              checked={branchState.isSelected}
                              onChange={() => toggleScopeBranch(category)}
                            />
                            <span className="min-w-0 flex-1" style={{ paddingLeft: category.depth * 12 }}>
                              <span className="block truncate">{category.name}</span>
                              {branchState.total > 1 ? (
                                <span className="block text-xs text-[oklch(0.66_0.01_255)]">
                                  รวม {branchState.total} หมวดในสาขา
                                  {branchState.isPartial ? " (เลือกบางส่วน)" : ""}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="px-2 py-6 text-center text-sm text-[oklch(0.5_0.012_255)]">ไม่พบหมวดที่ค้นหา</p>
                    )}
                  </div>
                </div>
              </section>

              {message ? (
                <div className="rounded-md border border-[oklch(0.85_0.06_25)] bg-[oklch(0.96_0.03_25)] px-3 py-2 text-sm font-medium text-[oklch(0.42_0.13_25)]">
                  {message}
                </div>
              ) : null}

              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[oklch(0.66_0.01_255)]">โซนอันตราย</p>
                {isConfirmingDelete ? (
                  <div className="rounded-md border border-[oklch(0.88_0.04_25)] bg-[oklch(0.985_0.012_25)] p-3">
                    <p className="text-xs font-semibold text-[oklch(0.42_0.13_25)]">ยืนยันลบผู้ใช้นี้ถาวร?</p>
                    <p className="mt-1 text-xs text-[oklch(0.5_0.012_255)]">
                      ข้อมูลสิทธิ์ทั้งหมดจะถูกลบ การกระทำนี้ไม่สามารถกู้คืนได้
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className={`${buttonStyles.danger} h-8 px-3 text-xs`}
                        disabled={isPending}
                        onClick={deleteUser}
                      >
                        {isPending ? "กำลังลบ" : "ยืนยันลบ"}
                      </button>
                      <button
                        type="button"
                        className={`${buttonStyles.secondary} h-8 px-3 text-xs`}
                        disabled={isPending}
                        onClick={() => setIsConfirmingDelete(false)}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`${buttonStyles.danger} h-9 w-full justify-center text-sm`}
                    disabled={isPending}
                    onClick={() => setIsConfirmingDelete(true)}
                  >
                    ลบผู้ใช้นี้ออกจากระบบ
                  </button>
                )}
              </section>
            </div>

            <div className="border-t border-[oklch(0.91_0.006_250)] bg-white px-5 py-4">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <button
                  type="button"
                  className={`${buttonStyles.primary} h-10 justify-center`}
                  disabled={isPending}
                  onClick={savePermissions}
                >
                  {isPending
                    ? "กำลังบันทึก"
                    : (selectedUser.status ?? "active") === "pending"
                      ? "บันทึกและเปิดใช้งาน"
                      : "บันทึกสิทธิ์"}
                </button>

                <button
                  type="button"
                  className={`${buttonStyles.secondary} h-10 justify-center`}
                  disabled={isPending}
                  onClick={startImpersonation}
                >
                  สลับตัวตน
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-[oklch(0.5_0.012_255)]">
                การบันทึกสิทธิ์จะสร้าง audit log action permission.update
                และจะเปิดใช้งานบัญชีที่ยังรอเปิดใช้งาน
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
