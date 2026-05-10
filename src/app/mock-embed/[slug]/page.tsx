import { notFound } from "next/navigation";

type MockEmbedPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const mockReports = {
  population: {
    title: "ภาพรวมประชากรจังหวัดเชียงใหม่",
    subtitle: "โครงสร้างประชากรตามอำเภอและช่วงอายุ",
    unit: "คน",
    total: "1,792,474",
    color: "bg-[oklch(0.4_0.13_260)]",
    values: [
      ["เมืองเชียงใหม่", 92],
      ["สันทราย", 72],
      ["หางดง", 58],
      ["ฝาง", 54],
      ["แม่ริม", 49],
      ["จอมทอง", 44],
    ],
  },
  diabetes: {
    title: "ความครอบคลุมการคัดกรองเบาหวาน",
    subtitle: "ร้อยละการคัดกรองกลุ่มเป้าหมายรายอำเภอ",
    unit: "%",
    total: "78.4",
    color: "bg-emerald-700",
    values: [
      ["สันกำแพง", 88],
      ["แม่แตง", 83],
      ["เมืองเชียงใหม่", 79],
      ["ดอยสะเก็ด", 76],
      ["แม่ริม", 72],
      ["ฝาง", 65],
    ],
  },
  vaccine: {
    title: "ความครอบคลุมวัคซีนเด็กปฐมวัย",
    subtitle: "ร้อยละความครอบคลุมตามเกณฑ์ในกลุ่มเด็ก 0-5 ปี",
    unit: "%",
    total: "91.2",
    color: "bg-cyan-700",
    values: [
      ["แม่ออน", 96],
      ["สารภี", 94],
      ["เมืองเชียงใหม่", 92],
      ["สันป่าตอง", 90],
      ["ฮอด", 87],
      ["อมก๋อย", 78],
    ],
  },
} as const;

export default async function MockEmbedPage({ params }: MockEmbedPageProps) {
  const { slug } = await params;
  const report = mockReports[slug as keyof typeof mockReports];

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] p-5 text-[oklch(0.21_0.015_255)]">
      <section className="h-full rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[oklch(0.5_0.012_255)]">
              Mock Dashboard Embed
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{report.title}</h1>
            <p className="mt-2 text-sm text-[oklch(0.5_0.012_255)]">{report.subtitle}</p>
          </div>
          <div className="rounded-md bg-[oklch(0.955_0.005_250)] px-4 py-3 text-right">
            <p className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">ค่ารวมล่าสุด</p>
            <p className="mt-1 text-3xl font-semibold text-[oklch(0.21_0.015_255)]">{report.total}</p>
            <p className="text-xs font-medium text-[oklch(0.5_0.012_255)]">{report.unit}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          {report.values.map(([label, value]) => (
            <div key={label} className="grid gap-2 md:grid-cols-[150px_minmax(0,1fr)_48px] md:items-center">
              <div className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">{label}</div>
              <div className="h-8 rounded bg-[oklch(0.955_0.005_250)]">
                <div className={`h-full rounded ${report.color}`} style={{ width: `${value}%` }} />
              </div>
              <div className="text-sm font-semibold text-[oklch(0.3_0.018_255)]">
                {value}
                {report.unit}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md bg-[oklch(0.955_0.005_250)] p-3">
            <p className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">รอบข้อมูล</p>
            <p className="mt-1 text-lg font-semibold">เมษายน 2569</p>
          </div>
          <div className="rounded-md bg-[oklch(0.955_0.005_250)] p-3">
            <p className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">ระดับข้อมูล</p>
            <p className="mt-1 text-lg font-semibold">อำเภอ</p>
          </div>
          <div className="rounded-md bg-[oklch(0.955_0.005_250)] p-3">
            <p className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">สถานะ</p>
            <p className="mt-1 text-lg font-semibold text-emerald-800">เผยแพร่แล้ว</p>
          </div>
        </div>
      </section>
    </main>
  );
}
