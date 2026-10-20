# SegmentedControl

A segmented control is a row of joined keys where exactly one is latched; use it for 2–4 mutually exclusive options that are worth seeing at once.

- Structure: `cor-seg` (`role="group"`, `aria-label`) holding `<button aria-pressed>`; the latched one shows a `cobalt` lamp line across its top on `cobalt-soft`.
- Used for chart granularity (Day / Week / Month), export format (PDF / CSV), report schedule (Once / Weekly / Monthly), alert delivery when only one is allowed.
- More than four options, or options that need explanation: use a Select. Several can be on at once: use Switches or ChannelMixer toggles.
- Arrow keys move between options; the change applies immediately, no Apply key.
