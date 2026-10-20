# TextField

A text field collects one value with a mono label above it, optional hint on the right, and help or error text below.

- Structure: `<label class="cor-fieldset">` > `cor-fieldset__label` (a `cor-tag` label, optional right-hand `cor-tag` hint such as "Required" or a unit) > `cor-input` > optional `cor-help`.
- Inputs sit on `surface-sunken` with a `line-strong` border; focus lifts them to `surface` with the `focus` ring.
- Numbers, IDs, thresholds and money use `cor-input--mono` and `inputmode="decimal"`; put the unit in the hint, not inside the value.
- Errors: `aria-invalid="true"`, `aria-describedby` to a `cor-help--error` that starts with the warning icon and says how to fix it. Validate on blur and on submit, never per keystroke.
- Search: wrap in `cor-input-wrap` with the search icon and a `/` shortcut hint.
- Read-only (workspace settings for non-admins): `readonly`, dashed border, lock in the hint, and a help line saying who can change it.
