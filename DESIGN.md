# Design

## Summary

Dashboard Hub uses a restrained product UI system with a warmer neutral base, ink-like text, and semantic accent colors for governance states. It favors dense, scannable layouts over decorative panels, while giving the home surface enough rhythm to feel active and operational.

## Color

- Background: `oklch(0.968 0.006 240)` for a cool operational canvas.
- Surface: `oklch(0.995 0.003 240)` for primary panels.
- Muted surface: `oklch(0.94 0.009 240)` for toolbars and nav.
- Text: `oklch(0.18 0.018 245)` for primary copy.
- Muted text: `oklch(0.46 0.025 245)` for metadata.
- Primary accent: `oklch(0.38 0.09 248)` for current navigation and primary actions.
- Review: amber, used for pending work.
- Healthy/published: emerald, used for successful states.
- Risk/fallback: rose, used for embed and sensitive warnings.
- Informational: sky/cyan, used for providers and neutral data signals.

Use accent color for state, selection, and action. Avoid large saturated fields unless a future surface specifically earns a committed color strategy.

## Typography

Use a native product font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`. Keep headings compact and steady, with hierarchy driven by size and weight rather than decorative display type. Body copy should stay readable in Thai and English.

## Layout

The primary shell is sidebar plus content. The home page should read as a command center:

1. A status-bearing top band with user context and operational counts.
2. A high-priority work lane for review and embed risk.
3. A mixed-density content area where featured dashboards, queues, and recent activity use different structures.
4. Compact navigation and category panels that show counts and task state.

Cards are allowed for individual repeated items, but full page sections should use bands, lists, rails, or table-like rows where those better fit the task.

## Components

- Buttons: consistent 8px radius, explicit hover/focus/disabled states.
- Badges: semantic background plus readable text, no color-only meaning.
- Panels: subtle border, light shadow only when it helps layering.
- Dashboard items: title, provider, status, owner, updated date, views, sensitivity, and embed health should be visible or one click away.
- Search and filters: dense controls with clear focus state.

## Motion

Use short transitions of 150-200ms for hover, focus, and state changes. Motion should communicate affordance or feedback only.

## Accessibility

Use semantic sections, labels or screen-reader text for form controls, strong focus rings, and reduced-motion-safe transforms. Long labels must wrap cleanly on mobile.
