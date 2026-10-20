# Screens and patterns

What each screen is made of, and the shared patterns for permissions, states and confirmation. Build screens from these parts; don't invent new ones per page.

## Screens

| Screen | Use cases / backlog | Built from |
| --- | --- | --- |
| Login, forgot password, accept invite | UC-001, #1, #13 | LoginPanel, TextField, Banner, Key |
| Connections (ad platforms only) | UC-002, #2, #5, #6, #16, #17, #28 | ConnectionRow, SignalMeter, ProgressRail, Banner, Menu, Dialog, and a one-line pointer to Settings › CRM |
| Analytics | UC-003, UC-008, #3, #12, #14, #19, #23, #24, #27, #29, #30 | AnalyticsPage, ChannelMixer, AttributionBay, DateRangePicker, Readout, TracePanel, BarPanel, ShareRing, HeatGrid, ReturnLedger, DataTable, CompareGrid, Drawer, LayoutEditor |
| Data | UC-004, #4, #15, #16 | Source list (connected ad platforms by channel code, then the CRM tagged `CRM`) beside the selected source: its SignalMeter, Sync now, Reconnect when failed, Remove data source (hold-to-confirm, says how many records are deleted); Switch rows for datasets with stored counts, "Waiting for next sync" after turning one on, and required CRM datasets (contacts, deals) locked on with the reason; a DataTable of the selected dataset with search and 25-row pages. Selection lives in the URL (`?source=&dataset=&q=&page=`). |
| Reports | UC-006, #8, #9 | Report list (`cor-report-table`) at `/reports`; ReportComposer at `/reports/new` and `/reports/{id}` with a live paper preview; export to PDF or CSV through `/reports/export`; weekly or monthly email schedules; Badge, Toast, Banner with Retry |
| Team | UC-005, #7, #20, #21, #22 | MemberList, Tabs, Dialog (invite), Badge, Avatar |
| Settings | UC-007, #10, #25, #26 | Tabs as links in the URL (`?tab=general|alerts|notifications|workspace|crm`). **General** (only you): name, read-only sign-in email, default date range (7/30/90 days; Analytics opens to it unless the link names dates), and a line saying time zone and currency follow the workspace. **Alerts**: AlertBuilder, rule list, AlertFeed. **Notifications** (only you): a table of notifications × In-app / Email Switches; the weekly summary is email only and names the week start; "New members" shows to admins only. **Workspace** (admins; members read-only with a `--info` Banner): name, currency (no conversion), time zone (where every day starts), week start. **CRM**: CrmPanel. Each section saves with one Save key that reads "Saved" for 2 seconds; HubSpot sign-in returns to `?tab=crm`. |

## Ad platforms and the CRM

- **Ad platforms** (Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, Microsoft Ads) are connections and channels. They supply spend, impressions, clicks and their own conversion counts.
- **The CRM** (HubSpot) connects in Settings › CRM. It supplies contacts, lifecycle stages and deals, and attributes each lead and closed-won deal to the platform, campaign and ad by last ad interaction. It is never a channel: it never appears on Connections, in the mixer, ledger, share ring or traces.
- With a CRM, Analytics shows Leads, Cost per lead and ROAS on closed-won revenue, plus an AttributionBay saying how many CRM leads matched an ad. Without one, every conversion-based number carries the Platform-reported badge and an info Banner offers to connect HubSpot.
- The drill-down goes channel → campaign → ad, because the CRM attributes to the ad.

## Permissions

- Two roles: Admin and Member. Admins manage connections, data sources, team and workspace settings; members view, build reports and create personal alerts.
- Members see admin-only screens read-only, never hidden: fields go `readonly` with a lock hint, action keys are removed (not disabled), and an `--info` Banner says who can change it.
- A disabled key always has a tooltip with the reason.

## States every bay and page needs

1. **Loading**: Skeletons in the content's shape after 300ms.
2. **Empty**: EmptyState with the reason and one action (nothing connected · no data in window · feature unused).
3. **Partial**: a source failed or is stale. Bay-level Banner, the rest still renders, the affected series goes dotted. Stale banners say COR keeps retrying every hour and carry no action; only a failed source (revoked access) offers Reconnect.
4. **Error**: the bay couldn't load at all. Banner `--failed` inside the bay with Retry; never a blank bay.
5. **Ready**.

## Confirming and undoing

- Reversible actions (remove a bay, pause an alert, mute a channel) happen at once and offer Undo in a Toast.
- Irreversible actions (disconnect a platform and delete its data, remove a member, delete a report) use a hold-to-confirm Key. When the consequence needs explaining, put that key inside a Dialog that states exactly what will be deleted.
- Never use the browser's confirm().

## Forms

- Labels above fields as tags; required fields marked "Required" in the hint, optional ones unmarked when most are required.
- Validate on blur and on submit. Errors say how to fix, sit under the field, and move focus to the first invalid field on submit.
- Settings save per section with one Save key at the bottom of the section; the key reads "Saved" for 2 seconds after.

## Keyboard

- Global: G then A/C/D/R/T/S to navigate; / to search; E to customize; ? to open the shortcut sheet; Esc closes the top overlay.
- Every key with a shortcut prints it. Shortcuts never fire while typing in a field.

## Responsive

- ≥1280px: full grid. 768–1279px: Readouts at 6 columns, everything else 12. <768px: sidebar becomes a bottom bar, bays stack, Drawer becomes a full-screen sheet, tables scroll sideways inside their bay, targets grow to 44px (`control-touch`).
