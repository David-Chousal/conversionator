# Banner

A banner is a persistent strip for a condition that affects what the user is looking at until it's fixed.

- Classes: `cor-banner` (caution: expiring, stale, partial), `--failed` (something broke), `--info` (permissions, read-only, edit mode hints). Square corners, full width of its container.
- Placement: under the top bar for workspace-wide issues; directly under a bay's rail for one source's problem in that bay (the bay keeps drawing the other sources).
- Copy: bold what happened, then what COR is doing about it or what to do. One action key at the end.
- Banners don't auto-dismiss; they clear when the condition clears. At most two page-level banners; more collapse into "3 connection issues · Review".
