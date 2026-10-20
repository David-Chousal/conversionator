# Select

A select picks one value from a list too long for a SegmentedControl: time zone, currency, metric, platform, role.

- Closed: a `cor-input cor-input--select` button with the chevron; open: a `cor-menu` with `role="listbox"` directly below, same width or wider.
- Options are `cor-menu__item` with `aria-checked`; the check icon marks the current value. Group long lists with `cor-menu__head` tags.
- Over 12 options (time zones, campaigns): put a search field at the top of the menu and filter as the user types.
- Keyboard: Enter/Space opens, arrows move, typing jumps, Esc closes without changing.
- The consumer provides options, the value and the change handler; the menu renders at `z-menu`.
