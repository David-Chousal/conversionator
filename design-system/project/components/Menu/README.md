# Menu

A menu lists actions for one object, opened from its ⋯ key or by right-click: a bay, a connection row, a table row, a member.

- Structure: `cor-menu` (`role="menu"`) of `cor-menu__item`s with an icon, a label and an optional `kbd` or `cor-menu__meta`; `cor-menu__sep` between groups; `cor-menu__head` names the object when the trigger doesn't.
- Order: most-used first, navigation out (external links) next, destructive last after a separator in `--danger`.
- Destructive items that delete data open a confirmation with a hold-to-confirm Key; "Remove from view" (reversible) acts at once with an Undo toast.
- `z-menu`, opens below the trigger, flips up near the viewport edge; arrows move, Enter acts, Esc closes and returns focus to the trigger.
