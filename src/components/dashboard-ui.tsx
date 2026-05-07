import Link from "next/link";
import type { ReactNode } from "react";

type ActionLink = {
  href: string;
  label: string;
  primary?: boolean;
};

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700";

export const buttonStyles = {
  primary: `inline-flex items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-slate-50 transition duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
  secondary: `inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
  danger: "inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition duration-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50",
};

export const fieldStyles =
  "rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-sky-700 focus:ring-2 focus:ring-sky-100";

export function Badge({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  maxWidth = "max-w-7xl",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ActionLink[];
  maxWidth?: string;
}) {
  return (
    <header className="border-b border-slate-200 bg-slate-50">
      <div className={`mx-auto flex ${maxWidth} flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions?.length ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`${action.primary ? buttonStyles.primary : buttonStyles.secondary} h-10`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function MetricTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "info" | "review" | "success" | "risk" | "category";
}) {
  const toneClass = {
    neutral: "bg-slate-100 text-slate-950 ring-slate-200",
    info: "bg-slate-100 text-slate-950 ring-slate-200",
    review: "bg-slate-100 text-slate-950 ring-slate-200",
    success: "bg-slate-100 text-slate-950 ring-slate-200",
    risk: "bg-slate-100 text-slate-950 ring-slate-200",
    category: "bg-slate-100 text-slate-950 ring-slate-200",
  };

  return (
    <div className={`rounded-lg p-4 ring-1 ${toneClass[tone]}`}>
      <p className="text-sm font-semibold opacity-75">{label}</p>
      <strong className="mt-2 block text-3xl font-semibold tracking-tight">{value}</strong>
    </div>
  );
}

export function FilterShell({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
      {children}
    </section>
  );
}

export function TableShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
