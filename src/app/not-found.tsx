import Link from "next/link";
import { buttonStyles } from "@/components/dashboard-ui";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Dashboard Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">ไม่พบหน้าหรือ Dashboard นี้</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          รายการนี้อาจถูกย้าย ถูก archive หรือผู้ใช้ปัจจุบันไม่มีสิทธิ์เข้าถึง
          กลับไปที่ Catalog เพื่อตรวจรายการที่มองเห็นได้ในสิทธิ์ปัจจุบัน
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/catalog"
            className={`${buttonStyles.primary} h-10`}
          >
            ไปที่ Catalog
          </Link>
          <Link
            href="/"
            className={`${buttonStyles.secondary} h-10`}
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}
