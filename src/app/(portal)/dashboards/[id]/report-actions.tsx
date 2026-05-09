"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonStyles } from "@/components/dashboard-ui";

type RecentReport = {
  id: string;
  title: string;
  category: string;
  viewedAt: string;
};

type CurrentReport = {
  id: string;
  title: string;
  category: string;
};

const storageKey = "health-report-recently-viewed";

function readRecentReports(): RecentReport[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function writeRecentReports(reports: RecentReport[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(reports.slice(0, 6)));
}

export function FavoriteButton({
  dashboardId,
  initialFavorite,
}: {
  dashboardId: string;
  initialFavorite: boolean;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, setPending] = useState(false);

  async function toggleFavorite() {
    const nextFavorite = !favorite;
    setFavorite(nextFavorite);
    setPending(true);

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: nextFavorite }),
      });

      if (!response.ok) {
        throw new Error("Unable to update favorite");
      }
    } catch {
      setFavorite(!nextFavorite);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={`${favorite ? buttonStyles.primary : buttonStyles.secondary} h-9 px-3 text-xs`}
      disabled={pending}
      onClick={toggleFavorite}
    >
      {favorite ? "บันทึกไว้แล้ว" : "บันทึกไว้"}
    </button>
  );
}

export function RecentlyViewedReports({ currentReport }: { currentReport: CurrentReport }) {
  const [reports, setReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    const current: RecentReport = {
      ...currentReport,
      viewedAt: new Date().toISOString(),
    };
    const nextReports = [
      current,
      ...readRecentReports().filter((report) => report.id !== currentReport.id),
    ].slice(0, 6);

    writeRecentReports(nextReports);
    setReports(nextReports.filter((report) => report.id !== currentReport.id).slice(0, 5));
  }, [currentReport]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">เปิดดูล่าสุด</h2>
      {reports.length ? (
        <div className="mt-3 space-y-2">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/dashboards/${report.id}`}
              className="block rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm hover:border-slate-300 hover:bg-white"
            >
              <span className="block truncate font-semibold text-slate-900">{report.title}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{report.category}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
          ยังไม่มีรายการอื่นที่เปิดดูก่อนหน้า
        </p>
      )}
    </section>
  );
}
