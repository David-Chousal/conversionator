# Badge

A badge is a small mono label for a fixed property of a row: role, invitation state, permission, schedule.

- Classes: `cor-badge` (outlined), `--solid` (Admin only, `ink` fill), `--pending` (dashed `caution`, with the expiry), `--muted` (secondary facts such as schedule or read-only).
- Badges describe; they never act. Sync health uses SignalMeter, metric change uses the Readout slope, never a badge.
- Keep the text under 24 characters, uppercase via the class, no trailing punctuation.
