COR is an operator's console for marketing teams: every ad platform, CRM and tracker patched into one board. It looks like an instrument, not a SaaS template. Widgets hang from heavy rails instead of sitting in rounded cards, buttons are keys you press, sync status reads like signal strength, and every number shows where it sits in its own history. A marketer should be able to glance at any screen and know in two seconds what is up, what is down, and what is broken.

## Principles

- **Rails, not cards.** A widget is a *bay*: a 2px `rail` rule with its title set on it, content hanging below on `bg`. No boxed, rounded, shadowed panels on the page.
- **Data is the loudest thing on screen.** Chrome is neutral (`bg`, `line`, `ink`). Color is spent on channels, deltas and status.
- **Outcomes are attributed, and say by whom.** Ad platforms supply spend, impressions and clicks. Leads, deals and revenue come from the CRM (HubSpot), credited to the platform, campaign and ad by last ad interaction. Without a CRM they are each platform's own numbers and are labelled **Platform-reported** everywhere they appear.
- **Every number has context.** A value always comes with its comparison and its range ("$48,210 · +12.4% · 90-day range $38.9k–$51.7k").
- **State is visible at rest.** Connections and bays show a SignalMeter and a word. Nothing that needs attention hides behind a hover.
- **Operators use keyboards.** Every key shows its shortcut; the mixer, scrubber and bays are fully keyboard-driven.

## Voice and copy

- Plain, direct, second person. Write like a sharp analyst talking to a busy marketer.
- Name things by what marketers recognise: *Connections*, *Spend*, *ROAS*, *Campaigns*. Never *integrations config*, *webhook*, *ETL*, *data layer*.
- Sentence case for titles and keys. `tag` style (mono uppercase) for labels, channel codes, status words and axis dates.
- Channels are addressed by code and name: `CH·01` Google Ads. Codes follow connection order and never change once assigned. Channels are ad platforms only; HubSpot is "your CRM", never a channel.
- With a CRM, say Leads, Cost per lead, Deals won, Cost per deal. Without one, say Conversions and CPA and add the Platform-reported badge.
- Keys say what happens: "Connect Google Ads", "Sync now", "Export CSV", "Hold to disconnect". Confirmations echo it: "Synced 4,120 rows".
- Errors say what broke and the fix: "Meta Ads stopped syncing at 9:42 AM. Reconnect to resume." No apologies.
- Metric abbreviations uppercase: CTR, CPC, CPA, CPM, ROAS, ROI. No emoji anywhere.

## Color

- The page is `bg`. `surface` is only for floating layers (menus, tooltips) and the sidebar. `surface-sunken` fills inputs and table header rows.
- `rail` (2px, `ink`) tops every bay and forms the ledger spine; `line` is for gridlines, table rules and range tracks; `line-strong` for control borders.
- `cobalt` is the only interactive color: the primary key, links, the scrubber window, the crosshair, the focus ring. `cobalt-soft` fills the selected window and selected rows.
- `flare` marks annotations: flags on traces, alert thresholds. Never text, never status.
- Change: `positive` and `negative` follow meaning, not direction (▲ CPA is negative). Metrics with no right direction, such as spend, use `ink`.
- Sync: `positive` = Synced, `caution` = Stale, `negative` = Failed, `ink-muted` = Paused. Always bars plus a word.
- Channels use `ch-1` … `ch-6` in connection order, never the vendor's brand colors. Muted channels turn hatched.

## Typography

- **Satoshi** (`sans`) for everything with words, and for the big readout numbers. Files: `fonts/Satoshi-Regular.woff2`, `-Medium`, `-Bold` (ITF Free Font License, free for commercial use, from Fontshare). Satoshi has no 600 weight; use 500 or 700. In the app, self-host these or load `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap`.
- **IBM Plex Mono** (`mono`) for `tag` and `metric`: labels, codes, table numbers, axes, tooltips. Load from Google Fonts: `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap`.
- `page-title` for the page name, `bay-title` on rails, `readout` for headline numbers, `display` only on login and empty states.
- In a readout, units and cents drop to 60% in `ink-muted` so the meaningful digits lead: "$18<small>.62</small>".
- All column numbers use `metric` with tabular figures, right-aligned.

## Layout

- App shell: a 232px sidebar on `surface` (Analytics, Connections, Data, Reports, Team, Settings, each with its shortcut), a top bar with `page-title`, then the ChannelMixer as the first bay of every data page.
- 12-column grid (`span-3/4/6/8/12`), `space-6` page gutter, `space-6` between bays horizontally and `space-8` vertically. Readouts span 3 columns; traces 6 or 12; the ReturnLedger 6 or 12; tables 12.
- **Strict column grid in lists.** Rows built with `cor-list__row` use one shared template where only the main (name) column flexes (`minmax(0,1fr)`); every other column, including actions, gets a fixed width. Never use `auto` or several `fr` tracks: per-row content (a "Reconnect" key vs. "Sync now") would then shift the columns. Cells start at the same x in every row, header row and section.
- Bay anatomy: rail, then a head row with `bay-title` (or a `tag`) left and scope `tag` right, then `space-4` to content.
- Below 768px the sidebar becomes a bottom bar, bays stack, and the mixer's toggles wrap.

## Charts

- Full rules in **Data visualization**. In short: direct labels instead of legends, one dollar scale for spend vs. return, zero baselines for bars, channels always in `ch-n`, `flare` only for annotations, hatching means "reference, not live".

## Components

- **Actions**: Key, SegmentedControl.
- **Inputs**: TextField, Select, Choice, Switch, TokenInput, DateRangePicker, ChannelMixer.
- **Navigation**: Sidebar, Tabs.
- **Status**: SignalMeter, Badge, Avatar, Tooltip.
- **Feedback**: Toast, Banner, EmptyState, Skeleton, ProgressRail.
- **Overlays**: Menu, Dialog, Drawer.
- **Data display**: Readout, AttributionBay, DataTable, CompareGrid.
- **Charts**: TracePanel, BarPanel, ShareRing, HeatGrid, ReturnLedger.
- **Settings**: CrmPanel, AlertBuilder, AlertFeed, plus per-section forms (`cor-settings-form`: two columns of fieldsets, top-aligned, Save at the foot).
- **Screens**: ConnectionRow, MemberList, AlertBuilder, AlertFeed, ReportComposer, LayoutEditor, LoginPanel, and AnalyticsPage as the reference composition.
- Class names are the contract: every component is styled by `components/bundle.css` with `cor-` classes on plain HTML. Build the React components on that markup.
- Which screen uses what, plus permissions, states, confirmation and keyboard rules: **Screens and patterns**. Number and date formats: **Numbers, dates and units**. Accessibility: **Accessibility**.

## States and motion

- Focus: a solid 2px `focus` ring, 2px offset, both themes. Loading: hatched Skeletons, never spinners. Empty: EmptyState ("No signal"). Partial: a Banner under the bay's rail.
- Motion: keys drop in 80ms; menus, switches and the scrubber 120ms ease-out; drawers and progress 200ms. Nothing loops. Respect `prefers-reduced-motion`.
- Layers stack by the `zIndex` tokens only: sticky < drag < drawer < dialog < menu < toast < tooltip.

## Iconography

- COR draws its own icons: 26 glyphs in **Assets › Icons**, on a 16px grid, 1.5px stroke, square caps, matching the keys and rails. Inline them with `stroke: currentColor` (`cor-ico`); 20px in the sidebar.
- Icons accompany words. Icon-only keys need an `aria-label` and a tooltip.
- Platform logos (Google Ads, Meta, LinkedIn, TikTok, Microsoft) come from each vendor's official brand kit and appear only in the 32px platform tile on Connections and as 20px marks in compare heads. HubSpot's logo appears only in Settings › CRM. The monogram tiles in the previews are placeholders.

## Logo

- COR has no logo yet. Set the wordmark as **COR** in Satoshi Bold, `ink`, letter-spacing −0.04em. Do not draw a mark until one is designed.
