"use client";

import { useMemo, useState, useTransition } from "react";
import { buttonStyles, fieldStyles } from "@/components/dashboard-ui";
import type { CategoryOption } from "@/lib/category-utils";
import type { AccessRequestStatus, PortalRole } from "@/lib/portal-types";
import type { AccessRequest } from "@/lib/db/users";

type AccessRequestFormProps = {
  categories: CategoryOption[];
  roles: PortalRole[];
  currentRoles: PortalRole[];
  requests: AccessRequest[];
};

const roleLabels: Record<PortalRole, string> = {
  system_admin: "ผู้ดูแลระบบ",
  category_admin: "ผู้ดูแลหมวดรายงาน",
  project_manager: "ผู้จัดการหน่วยงาน",
  editor: "เจ้าหน้าที่จัดทำรายงาน",
  viewer: "ผู้ดูรายงาน",
};

const statusLabels: Record<AccessRequestStatus, string> = {
  pending: "รอดำเนินการ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  cancelled: "ยกเลิก",
};

const requestableRoles: PortalRole[] = ["viewer", "editor", "project_manager", "category_admin"];

export function AccessRequestForm({
  categories,
  roles,
  currentRoles,
  requests,
}: AccessRequestFormProps) {
  const defaultRoles: PortalRole[] = currentRoles.length ? currentRoles : ["viewer"];
  const [roleDraft, setRoleDraft] = useState<PortalRole[]>(defaultRoles);
  const [categoryDraft, setCategoryDraft] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasPendingRequest = requests.some((request) => request.status === "pending");
  const visibleRoles = useMemo(
    () => roles.filter((role) => requestableRoles.includes(role)),
    [roles],
  );

  function toggleRole(role: PortalRole) {
    setRoleDraft((current) => {
      const next = current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role];
      return next.length ? next : ["viewer"];
    });
  }

  function toggleCategory(categoryId: string) {
    setCategoryDraft((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  }

  function submitRequest() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles: roleDraft,
          categoryIds: categoryDraft,
          reason,
        }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(body?.error ?? "ไม่สามารถส่งคำขอได้");
        return;
      }

      setMessage("ส่งคำขอแล้ว ผู้ดูแลระบบจะตรวจสอบและอนุมัติสิทธิ์ให้");
      window.location.reload();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">ขอสิทธิ์ใช้งานระบบ</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          เลือกบทบาทและหมวดรายงานที่เกี่ยวข้องกับงานของคุณ เพื่อให้ผู้ดูแลระบบตรวจสอบ
        </p>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-slate-900">บทบาทที่ต้องการ</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {visibleRoles.map((role) => (
              <label key={role} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={roleDraft.includes(role)}
                  onChange={() => toggleRole(role)}
                  disabled={hasPendingRequest}
                />
                {roleLabels[role]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-slate-900">หมวดรายงานที่เกี่ยวข้อง</legend>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
            {categories.map((category) => (
              <label key={category.id} className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  checked={categoryDraft.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  disabled={hasPendingRequest}
                />
                <span style={{ paddingLeft: category.depth * 12 }}>
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-900">เหตุผลประกอบคำขอ</span>
          <textarea
            className={`${fieldStyles} mt-2 min-h-32 w-full`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={hasPendingRequest}
            placeholder="เช่น รับผิดชอบรายงานกลุ่มโรคไม่ติดต่อ ต้องจัดการรายงานในหมวดสถานะสุขภาพ..."
          />
        </label>

        {message ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <button
          type="button"
          className={`${buttonStyles.primary} mt-5 h-10 justify-center`}
          disabled={isPending || hasPendingRequest}
          onClick={submitRequest}
        >
          {hasPendingRequest ? "มีคำขอที่รอดำเนินการแล้ว" : isPending ? "กำลังส่งคำขอ" : "ส่งคำขอ"}
        </button>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">ประวัติคำขอของคุณ</h2>
        <div className="mt-4 space-y-3">
          {requests.length ? (
            requests.map((request) => (
              <article key={request.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {statusLabels[request.status]}
                  </p>
                  <span className="text-xs text-slate-500">
                    {new Date(request.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{request.reason}</p>
                {request.reviewNote ? (
                  <p className="mt-2 rounded-md bg-white px-3 py-2 text-sm text-slate-600">
                    {request.reviewNote}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              ยังไม่มีคำขอสิทธิ์
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
