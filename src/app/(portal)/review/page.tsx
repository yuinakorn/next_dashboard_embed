import { PageHeader } from "@/components/dashboard-ui";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listDashboards } from "@/lib/db/dashboards";
import { ReviewQueue } from "./review-queue";

export default async function ReviewPage() {
  const currentUser = await requireCurrentUser();
  const dashboards = await listDashboards(currentUser.id);
  const reviewDashboards = dashboards.filter(
    (dashboard) =>
      dashboard.status === "in_review" ||
      (dashboard.ownerTeamId === currentUser.teamId && dashboard.status === "published"),
  );

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <PageHeader
        eyebrow="Governance Workflow"
        title="คิวตรวจสอบ"
        description="อนุมัติ ปฏิเสธ และบันทึก Audit event ก่อนเผยแพร่ Dashboard"
      />

      <div className="mx-auto max-w-7xl px-5 py-6">
        <ReviewQueue currentUser={currentUser} initialDashboards={reviewDashboards} />
      </div>
    </main>
  );
}
