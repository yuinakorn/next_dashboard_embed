function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <header className="border-b border-slate-200 bg-slate-50">
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
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 p-4">
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
