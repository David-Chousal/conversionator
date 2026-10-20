# Tooltip

A tooltip gives a short hint on hover or focus: why a key is disabled, the exact time behind a relative one, what an icon-only key does and its shortcut.

- `cor-tip`: inverted (`ink` ground, `bg` text), mono 12px, max 240px, `radius-sm`, `z-tooltip`.
- Appears after 400ms hover or immediately on keyboard focus; disappears on Esc, blur or pointer leave.
- Never put actions or essential information only in a tooltip. Chart hover values use the TracePanel tip, not this.
