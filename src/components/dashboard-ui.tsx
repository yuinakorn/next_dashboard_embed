import Link from "next/link";
import type { ReactNode } from "react";
import { palette, tone as toneTokens, type Tone } from "@/lib/design-tokens";

type ActionLink = {
  href: string;
  label: string;
  primary?: boolean;
};

// Cool minimal tokens. Keep arbitrary values aligned with src/lib/design-tokens.ts.

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.14_258)]";

export const buttonStyles = {
  primary: `inline-flex items-center rounded-md bg-[oklch(0.21_0.015_255)] px-4 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
  secondary: `inline-flex items-center rounded-md border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] px-4 text-sm font-semibold text-[oklch(0.21_0.015_255)] transition-colors duration-150 hover:bg-[oklch(0.955_0.005_250)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
  danger: `inline-flex items-center rounded-md border border-[oklch(0.88_0.04_25)] bg-[oklch(0.96_0.03_25)] px-4 text-sm font-semibold text-[oklch(0.42_0.13_25)] transition-colors duration-150 hover:bg-[oklch(0.92_0.05_25)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`,
};

export const fieldStyles =
  "rounded-md border border-[oklch(0.91_0.006_250)] bg-white px-3 text-sm text-[oklch(0.21_0.015_255)] outline-none transition-colors duration-150 placeholder:text-[oklch(0.66_0.01_255)] focus:border-[oklch(0.5_0.14_258)] focus:ring-2 focus:ring-[oklch(0.95_0.028_258)]";

export function Badge({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  if (tone) {
    const t = toneTokens[tone];
    return (
      <span
        className="inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[11px] font-semibold"
        style={{ background: t.bg, color: t.ink }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-semibold ${className ?? ""}`}
    >
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
    <header
      className="border-b"
      style={{ background: palette.paper, borderColor: palette.border }}
    >
      <div
        className={`mx-auto flex ${maxWidth} flex-col gap-3 px-5 py-5 md:flex-row md:items-end md:justify-between`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: palette.accent }}
              aria-hidden="true"
            />
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: palette.accentDeep }}
            >
              {eyebrow}
            </p>
          </div>
          <h1
            className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight"
            style={{ color: palette.ink }}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-sm" style={{ color: palette.inkMuted }}>
              {description}
            </p>
          ) : null}
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
  const accentMap: Record<typeof tone, string> = {
    neutral: palette.inkFaint,
    info: palette.accent,
    review: palette.amber,
    success: palette.emerald,
    risk: palette.rose,
    category: palette.indigo,
  };
  const dot = accentMap[tone];

  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: dot }}
          aria-hidden="true"
        />
        <p
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: palette.inkMuted }}
        >
          {label}
        </p>
      </div>
      <strong
        className="mt-1 block text-[26px] font-semibold leading-tight tracking-tight tabular-nums"
        style={{ color: palette.ink }}
      >
        {value}
      </strong>
    </div>
  );
}

export function FilterShell({ children }: { children: ReactNode }) {
  return (
    <section
      className="rounded-xl p-4"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
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
    <section
      className="overflow-hidden rounded-xl"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <div className="border-b px-5 py-4" style={{ borderColor: palette.border }}>
        <h2 className="text-base font-semibold" style={{ color: palette.ink }}>
          {title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: palette.inkMuted }}>
          {description}
        </p>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
