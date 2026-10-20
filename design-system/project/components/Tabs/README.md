# Tabs

Tabs split one page into sections that share context: Settings (General, Alerts, Notifications, Workspace), Team (Members, Pending invites), a Data source (Datasets, Records, Sync history).

- Structure: `cor-tabs` (`role="tablist"`) of `cor-tab` buttons with `aria-selected`; counts go in a `.count` span.
- Labels are mono uppercase like every COR tag; the selected tab sits on a 2px `rail` underline that overlaps the 1px `line`.
- Arrow keys move between tabs. The selected tab is kept in the URL hash (`#alerts`) so it can be linked.
- Saved dashboard views use the same tabs (see LayoutEditor). Don't nest tabs.
