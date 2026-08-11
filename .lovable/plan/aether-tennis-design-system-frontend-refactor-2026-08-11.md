# Aether Tennis — Design System & Frontend Refactor

A visual architecture refactor across the marketing site and the authenticated product. No database, query, auth, or routing changes. Same features, materially different craft level.

## What stays

- All business logic: auth, season creation, invites/join tokens, fixture generation, captain rotation, scheduling, score entry/confirmation, standings math, admin actions, MCP integration.
- All routes and page-to-file mapping.
- Brand: AETHER. / TENNIS logo, Outfit for display, Inter for UI, lime accent (73 100% 50%), dark identity.
- Structurally sound files: the 7-step wizard state machine, season tab data fetching, match detail data flow. These get new presentation, not new logic.

## What changes

### Design tokens (src/index.css + tailwind.config.ts)
Replace the single flat `--card` + `glass-card` model with a real surface hierarchy:

```text
--background      deep neutral, slightly green-tinted charcoal (not pure black)
--surface-1       large structural regions, no/低 radius
--surface-2       UI modules, rounded-lg / rounded-xl
--surface-elevated  modals, composers, command menu
--border-subtle   white/[0.06]
--border-default  white/[0.08]
--border-strong   white/[0.14]
--text-primary / --text-secondary / --text-muted
--aether-lime     existing 73 100% 50%
```

Removed from the system: `--shadow-glow` as a default, gradient text, decorative blobs, `animate-float`, `.glow-shadow` on ordinary elements. Glass becomes one opt-in utility used in maybe two places, not the base card.

Radius policy: `rounded-md` controls, `rounded-lg` buttons/inputs, `rounded-xl` modules, `rounded-2xl+` only for avatars/pills. Borders carry hierarchy; shadows used only on elevated surfaces.

### Typography scale
Named utilities so sizes stop being ad hoc: `text-display`, `text-page-title`, `text-section`, `text-ui-title`, `text-body`, `text-meta`, `text-eyebrow`. Outfit restricted to display/page/section; Inter everywhere in app UI. Tight tracking only above ~40px. Tabular numerals for all scores, standings, and progress numbers.

### Color discipline
Lime reserved for: primary CTA, active nav, current captain, primary status, selected slot, rank 1, progress fill. Everything else neutral. Icons default to muted foreground.

### Grid + spacing
`PageContainer` with a 12-col grid at max-w-[1280px] (marketing sections may go to 1440px). Marketing sections use 7/5 and 5/7 asymmetric splits instead of centered 3-col card grids. Section rhythm standardized on a small set of spacing steps rather than arbitrary py-24/py-32.

## New shared primitives (src/components/ui-system/)

Only these — no speculative abstractions:

- `PageContainer` — grid + max width + page padding
- `PageHeader` — title, meta line, contextual actions
- `SectionHeader` — eyebrow/number + title + optional action
- `Surface` — variant: flat | module | elevated
- `Metric` / `ProgressMetric` — label, value, tabular numerals
- `StatusBadge` — replaces MatchStatusBadge, expanded to season/participant states
- `DataRow`, `MatchRow`, `RankingRow` — dense list rows
- `ActionPanel` — the "next action" hero block
- `EmptyState`
- `PageTabs` — extracted from SeasonDetail's inline tab bar
- `ProductPreview` — static, realistic UI fragments for the landing page

Button variants consolidated to primary / secondary / ghost / destructive in the existing shadcn `button.tsx` variants; no gradients, no glow, `rounded-lg`.

## Page-by-page

**Landing (Index.tsx)** — full recomposition. Restrained nav (Product, How it works, For groups, Season example; transparent → bordered on scroll). Product-led hero: headline + copy + two CTAs on the left, a layered composition of real Aether UI fragments (current captain, next match, standings, season progress) on the right. Typographic "built for" strip instead of fake logos. Problem statement section with a captain-rotation week timeline (current week in lime). Five numbered product sections alternating left/right, each showing actual product UI: create the season, share responsibility, schedule the match, play and record, watch the season move. Standings module styled like an analytics table. Compact footer.

**App shell (AppHeader.tsx)** — compact top bar, real nav (Seasons, plus contextual season nav), account menu replacing the raw email string + loose icon buttons. Mobile: simplified bar + sheet nav.

**SeasonCommandCenter.tsx** — flagship screen. Page header with season name, dates, format, status, and Manage/Invite actions. Main grid: large `ActionPanel` ("You are Scheduling Captain — 3 matches need times, deadline Thursday") + season progress on the right. Secondary row: upcoming matches, standings, recent results as integrated regions.

**SeasonDetail.tsx + tabs** — `PageTabs`; Schedule becomes an operational timeline grouped by round with compact `MatchRow`s and All / Needs scheduling / Scheduled / Completed filters. Standings becomes a real table desktop-side and compact ranking rows on mobile. Match history becomes a results ledger with clickable rows and filters. Members/Admin get the same row treatment.

**MatchDetail.tsx** — state-driven workflow. One primary action derived from match status (pending → propose, proposed → choose, scheduled → enter score, awaiting confirmation → confirm, completed → scorecard). Other sections collapse to summaries instead of all being exposed at once. Existing handlers unchanged.

**MatchScorecard.tsx** — sports-result presentation: FINAL header, per-player set totals, set/tiebreak grid with tabular numerals, metadata footer.

**Create Season wizard** — same 7 steps and same state hook. New shell: page header, horizontal progress nav, 7-col form column and 5-col live preview panel (name, players, projected matches, captain window, dates) on desktop; single column with a collapsible summary on mobile.

**Dashboard / HomeLanding / Auth / Join / NotFound / legal pages** — brought onto the same tokens, headers, and row primitives; HomeLanding's four identical tiles get real hierarchy.

## Cleanup

Remove `src/App.css` (unused CRA leftover), the `animate-float` keyframe, unused fade-delay variants, blob/gradient decorations, glow utilities on ordinary elements, and duplicated one-off `bg-white/5` + `rounded-2xl` + `backdrop-blur` combinations across the 26 files that currently use them. No business logic removed.

## Files expected to change

`src/index.css`, `tailwind.config.ts`, `index.html` (font weights), `src/components/ui/button.tsx`, `AppHeader.tsx`, `AetherLogo.tsx` (sizing props only), all 14 pages, all 4 season tabs, `MatchStatusBadge.tsx`, `WizardShell.tsx` + all 7 step components, plus new files under `src/components/ui-system/`. `App.css` deleted.

## Risks

- Highest-risk files are `MatchDetail.tsx` (388 lines) and `SeasonDetail.tsx` (415 lines) — dense logic mixed with markup. I will extract presentation and keep handlers byte-identical where possible, then verify each flow in the browser.
- The match-page state machine changes which controls are visible at a time. Every action stays reachable; if you'd rather keep all controls always visible, say so and I'll skip that part.
- Wizard preview panel reads from existing `wizardEstimates` — no new calculations.
- Tab/scroll behavior and toast wiring must be preserved when tabs move into `PageTabs`.

## Execution order

1. Tokens, typography, primitives
2. App shell + navigation
3. Landing page
4. Season Command Center
5. Schedule + Match Detail
6. Standings + Match History + Scorecard
7. Create Season wizard
8. Dashboard + secondary screens
9. Responsive + accessibility pass (375 → 1440)
10. Dead style removal

I'll verify flows in a headless browser at the end of each phase so functionality never silently regresses.
