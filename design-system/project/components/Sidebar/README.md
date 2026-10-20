# Sidebar

The sidebar is COR's main navigation: six destinations, each with a 20px icon, its name and a two-key shortcut.

- Order is fixed: Analytics, Connections, Data, Reports, Team, Settings. Shortcuts are G then the first letter (G A, G C…), shown as `kbd`.
- The current page gets `aria-current="page"`: `cobalt-soft` ground, `ink` text, `cobalt` icon.
- Top: the COR wordmark and the workspace name as a `cor-tag` (click opens a workspace menu). Bottom: avatar, name, role, sign out.
- Members don't see Team management actions, but Team stays in the nav (read-only list).
- 232px (`sidebar`) on `surface`. Below 768px it becomes a bottom bar of the six icons with labels under them, 44px tall.
