function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-[oklch(0.91_0.006_250)] ${className}`} />;
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <header className="border-b border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)]">
        <div className="mx-auto max-w-7xl px-5 py-5">
          <SkeletonBlock className="h-3 w-40" />
          <SkeletonBlock className="mt-3 h-8 w-72" />
          <SkeletonBlock className="mt-3 h-4 w-96 max-w-full" />
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-5 py-6">
        <section className="grid gap-4 md:grid-cols-3">
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
          <SkeletonBlock className="h-28" />
        </section>
        <SkeletonBlock className="h-16" />
        <section className="overflow-hidden rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)]">
          <div className="border-b border-[oklch(0.91_0.006_250)] p-4">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="mt-2 h-4 w-80 max-w-full" />
          </div>
          <div className="space-y-3 p-4">
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
            <SkeletonBlock className="h-14" />
          </div>
        </section>
      </div>
    </main>
  );
}
