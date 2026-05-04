import Link from "next/link";
import { mockCurrentUser, mockDashboards } from "@/lib/mock-portal-data";
import { ReviewQueue } from "./review-queue";

export default function ReviewPage() {
  const reviewDashboards = mockDashboards.filter(
    (dashboard) =>
      dashboard.status === "in_review" ||
      (dashboard.ownerTeamId === mockCurrentUser.teamId && dashboard.status === "published"),
  );

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Phase 3 - Governance Workflow</p>
            <h1 className="mt-1 text-2xl font-semibold">คิวตรวจสอบ</h1>
            <p className="mt-1 text-sm text-zinc-500">
              อนุมัติ ปฏิเสธ และบันทึก Audit event ก่อนเผยแพร่ Dashboard
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/audit"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              ประวัติ Audit
            </Link>
            <Link
              href="/catalog"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Catalog
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
            >
              หน้าหลัก
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6">
        <ReviewQueue currentUser={mockCurrentUser} initialDashboards={reviewDashboards} />
      </div>
    </main>
  );
}
