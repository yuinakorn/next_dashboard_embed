"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonStyles, fieldStyles } from "@/components/dashboard-ui";
import type { Dashboard } from "@/lib/portal-types";

type LifecycleAction = "submit_review" | "archive";
type ReviewDecision = "approve" | "reject";

export function DashboardLifecycleActions({
  dashboard,
  canSubmit,
  canArchive,
  canReview,
}: {
  dashboard: Dashboard;
  canSubmit: boolean;
  canArchive: boolean;
  canReview: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function postAction(
    endpoint: string,
    body: Record<string, string>,
    successMessage: string,
  ) {
    setPendingAction(body.action ?? body.decision ?? "action");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "ไม่สามารถบันทึกการทำงานได้");
      }

      setNote("");
      setMessage(successMessage);
      router.refresh();
    } catch (actionError) {
      const errorMessage =
        actionError instanceof Error ? actionError.message : "ไม่สามารถบันทึกการทำงานได้";
      setError(errorMessage);
    } finally {
      setPendingAction(null);
    }
  }

  function handleLifecycle(action: LifecycleAction) {
    const label = action === "submit_review" ? "ส่งตรวจสอบแล้ว" : "เก็บเข้าคลังแล้ว";
    void postAction(
      `/api/dashboards/${dashboard.id}/lifecycle`,
      { action, note },
      label,
    );
  }

  function handleReview(decision: ReviewDecision) {
    const label = decision === "approve" ? "อนุมัติและเผยแพร่แล้ว" : "ปฏิเสธพร้อมบันทึกเหตุผลแล้ว";
    void postAction(
      `/api/dashboards/${dashboard.id}/review`,
      { decision, note },
      label,
    );
  }

  const isPending = pendingAction !== null;

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-950">Lifecycle Workflow</h2>
        <p className="text-sm leading-6 text-slate-500">
          ส่งตรวจสอบ อนุมัติ ปฏิเสธ หรือ archive โดยทุก action จะถูกบันทึกใน audit trail
        </p>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-semibold text-slate-700">หมายเหตุ</span>
        <textarea
          className={`${fieldStyles} mt-2 min-h-24 w-full py-3 leading-6`}
          placeholder="ระบุเหตุผลหรือรายละเอียดประกอบการเปลี่ยนสถานะ"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {message ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`${buttonStyles.primary} h-10`}
          disabled={!canSubmit || isPending}
          onClick={() => handleLifecycle("submit_review")}
        >
          {pendingAction === "submit_review" ? "กำลังส่ง..." : "ส่งตรวจสอบ"}
        </button>
        <button
          type="button"
          className={`${buttonStyles.primary} h-10`}
          disabled={!canReview || isPending}
          onClick={() => handleReview("approve")}
        >
          {pendingAction === "approve" ? "กำลังอนุมัติ..." : "อนุมัติและเผยแพร่"}
        </button>
        <button
          type="button"
          className={`${buttonStyles.danger} h-10`}
          disabled={!canReview || isPending}
          onClick={() => handleReview("reject")}
        >
          {pendingAction === "reject" ? "กำลังปฏิเสธ..." : "ปฏิเสธ"}
        </button>
        <button
          type="button"
          className={`${buttonStyles.secondary} h-10`}
          disabled={!canArchive || isPending}
          onClick={() => handleLifecycle("archive")}
        >
          {pendingAction === "archive" ? "กำลัง archive..." : "Archive"}
        </button>
      </div>
    </section>
  );
}
