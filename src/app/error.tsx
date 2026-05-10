"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/dashboard-ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
          System state
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">โหลดข้อมูลไม่สำเร็จ</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[oklch(0.5_0.012_255)]">
          ระบบพบปัญหาระหว่างโหลดข้อมูล ลองใหม่อีกครั้ง หรือกลับไป Catalog เพื่อตรวจรายการอื่น
        </p>
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {error.message || "Unknown error"}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${buttonStyles.primary} h-10`}
            onClick={reset}
          >
            ลองใหม่
          </button>
          <Link
            href="/catalog"
            className={`${buttonStyles.secondary} h-10`}
          >
            ไปที่ Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
