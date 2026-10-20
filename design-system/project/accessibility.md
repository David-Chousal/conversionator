# Accessibility

COR targets WCAG 2.2 AA in both themes. These rules are part of every component's contract.

- **Contrast**: text tokens meet 4.5:1 on the grounds their usage notes name, in light and dark; `line-strong`, `focus`, icons and chart marks meet 3:1. Don't put text on `flare` or channel colors except `on-cobalt` on `cobalt`.
- **Never color alone**: deltas carry a sign and a slope glyph; sync status carries bars and a word; muted channels are hatched and their toggle goes hollow; the best value in CompareGrid gets ◆; invalid fields get an icon and a message.
- **Focus**: every interactive element shows the 2px `focus` ring with 2px offset on `:focus-visible`. Overlays trap focus and return it to their trigger.
- **Keyboard**: everything works without a pointer, including drag (grip + Space + arrows), hold-to-confirm (hold Space), the scrubber (arrows move the window, Shift+arrows resize it) and chart crosshairs (arrows step through points).
- **Charts**: each chart has an `aria-label` stating the takeaway and a "View as table" option with the same numbers.
- **Live regions**: toasts use `role="status"` (success) or `role="alert"` (failure); sync progress updates `aria-valuenow`; bays loading set `aria-busy`.
- **Motion**: only transitions of 80–200ms, nothing loops, everything respects `prefers-reduced-motion`.
- **Targets**: 34px controls on desktop, 44px below 768px.
- **Language**: plain words, no jargon labels, abbreviations limited to standard metric names (CTR, CPC, CPA, CPM, ROAS, ROI) with full names in tooltips on first use per page.
