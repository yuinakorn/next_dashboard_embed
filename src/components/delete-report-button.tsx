"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonStyles } from "@/components/dashboard-ui";

export function DeleteReportButton({
  dashboardId,
  title,
  redirectTo,
  compact = false,
}: {
  dashboardId: string;
  title: string;
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteReport() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Unable to delete report");
      }

      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "ไม่สามารถลบรายงานได้");
      setConfirming(false);
    } finally {
      setPending(false);
    }
  }

  if (confirming) {
    return (
      <div className="max-w-sm rounded-lg border border-[oklch(0.88_0.04_25)] bg-[oklch(0.985_0.012_25)] p-3 text-left shadow-sm">
        <p className="text-xs font-semibold text-[oklch(0.42_0.13_25)]">ลบรายงานนี้ถาวร?</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[oklch(0.5_0.012_255)]">
          {title}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${buttonStyles.danger} h-8 px-3 text-xs`}
            disabled={pending}
            onClick={deleteReport}
          >
            {pending ? "กำลังลบ" : "ยืนยันลบ"}
          </button>
          <button
            type="button"
            className={`${buttonStyles.secondary} h-8 px-3 text-xs`}
            disabled={pending}
            onClick={() => setConfirming(false)}
          >
            ยกเลิก
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className={`${buttonStyles.danger} ${compact ? "h-9 px-3 text-sm" : "h-9 px-3 text-xs"}`}
        disabled={pending}
        onClick={() => setConfirming(true)}
      >
        ลบ
      </button>
      {error ? <span className="max-w-48 text-xs text-rose-700">{error}</span> : null}
    </div>
  );
}
