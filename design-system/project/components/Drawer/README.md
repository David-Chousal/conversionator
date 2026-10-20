# Drawer

The drawer slides in from the right to show the rows behind a number, so the user can trace any metric to its campaigns without leaving the dashboard.

- Opens from clicking a Readout, a chart point, a ledger row or "Open breakdown" in a bay menu. 440px (`drawer`), `surface`, a 2px `rail` on its left edge, no scrim: the board stays visible and live.
- Contents top to bottom: breadcrumbs (`cor-crumbs`) of the drill path, the metric as a Readout for the current scope, a DataTable of contributors with a totals row that matches the readout exactly, then export and "Open in Data".
- Each crumb is a link back up the path. Clicking a row drills one level deeper (channel → campaign → ad) and adds a crumb.
- Esc or the close key closes it and returns focus to what opened it. At `z-drawer`; below 768px it becomes a full-screen sheet.
