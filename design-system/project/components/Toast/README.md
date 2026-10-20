# Toast

A toast confirms the result of something the user just did, or reports that it failed, without blocking the page.

- Structure: `cor-toast` + `--ok` / `--failed` (or neutral), icon, `cor-toast__body` with a bold result and a detail line, optional `cor-link` action, dismiss key.
- The title states the outcome with the real numbers: "Synced 4,120 rows from Google Ads", "Removed Sam Lee from Northwind".
- Stack bottom-left above the content, newest on top, max three, at `z-toast`. Success auto-dismisses after 5s (paused on hover/focus); failures stay until dismissed.
- Use `role="status"` for success, `role="alert"` for failure. Reversible actions offer Undo for the toast's lifetime instead of a confirmation beforehand.
- Problems not caused by the user's last action (a source broke overnight) are Banners, not toasts.
