# Key

Keys are COR's buttons: square-shouldered console keys with a keybed edge and the keyboard shortcut printed on them.

- Classes: `cor-key` plus `cor-key--primary` (one per view, `cobalt` fill), `cor-key--hold` (destructive), `cor-key--icon` (icon only, square), `cor-key--sm` (28px, for tables and toolbars). Add a `<kbd>` when a shortcut exists.
- Pressing drops the key 1px and flattens the keybed (`:active`). A latched toggle such as Customize sets `is-pressed` and `aria-pressed="true"`.
- Busy: `is-busy` + `aria-busy="true"`, the label changes to the running verb ("Syncing…"), the key stays the same width. Disabled keys go flat on `surface-sunken`; pair them with a tooltip saying why ("Only admins can invite").
- Destructive actions are **hold to confirm**: animate `--held` from 0% to 100% over 900ms while pointer or Space is held, fire at 100%, reset on early release. Keyboard users hold Space; screen readers announce "Hold to disconnect Meta Ads".
- Icon-only keys need `aria-label` and a `cor-tip` tooltip.
- Navigation and drill-downs use `cor-link` (underlined `cobalt` text with →), never a key.
