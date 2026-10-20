# Skeleton

Skeletons hold the shape of a bay while its data loads, so the layout never jumps.

- `cor-skel` blocks hatched in `line-strong`, sized to the content they replace (`--num` for a readout value). The bay keeps its real rail, title and tags; the scope tag says "Syncing…".
- Static, no shimmer: COR doesn't loop animations. Set `aria-busy="true"` on the bay.
- Show skeletons only after 300ms; faster loads swap straight to data. Never put a spinner inside a bay.
