// Cool minimal design tokens. Modern, restrained, Linear/Vercel-flavored.
// Use these everywhere. If you reach for raw hex or slate-950, stop and pick from here.

export const palette = {
  base: "oklch(0.985 0.003 250)",
  paper: "oklch(0.998 0.002 250)",
  muted: "oklch(0.955 0.005 250)",
  mutedHover: "oklch(0.94 0.005 250)",
  border: "oklch(0.91 0.006 250)",
  borderStrong: "oklch(0.85 0.008 250)",
  ink: "oklch(0.21 0.015 255)",
  inkSoft: "oklch(0.3 0.018 255)",
  inkMuted: "oklch(0.5 0.012 255)",
  inkFaint: "oklch(0.66 0.01 255)",
  accent: "oklch(0.5 0.14 258)",
  accentDeep: "oklch(0.4 0.13 260)",
  accentSoft: "oklch(0.95 0.028 258)",
  accentTint: "oklch(0.978 0.012 258)",
  amber: "oklch(0.65 0.12 75)",
  amberDeep: "oklch(0.42 0.1 75)",
  amberSoft: "oklch(0.96 0.035 80)",
  rose: "oklch(0.58 0.15 25)",
  roseDeep: "oklch(0.42 0.13 25)",
  roseSoft: "oklch(0.96 0.03 25)",
  emerald: "oklch(0.55 0.11 165)",
  emeraldDeep: "oklch(0.4 0.1 165)",
  emeraldSoft: "oklch(0.96 0.025 165)",
  indigo: "oklch(0.48 0.12 270)",
  indigoDeep: "oklch(0.38 0.11 270)",
  indigoSoft: "oklch(0.96 0.025 270)",
} as const;

export const tone = {
  /** Quiet pastel chip + readable ink for status/category labels. */
  neutral: { bg: palette.muted, ink: palette.inkMuted },
  info: { bg: palette.accentSoft, ink: palette.accentDeep },
  success: { bg: palette.emeraldSoft, ink: palette.emeraldDeep },
  review: { bg: palette.amberSoft, ink: palette.amberDeep },
  risk: { bg: palette.roseSoft, ink: palette.roseDeep },
  internal: { bg: palette.indigoSoft, ink: palette.indigoDeep },
} as const;

export type Tone = keyof typeof tone;
