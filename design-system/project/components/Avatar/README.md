# Avatar

An avatar marks a person with their initials in mono on a ringed disc.

- Sizes: 28px default (lists, comments), 36px `--lg` (profile, sidebar user). `--ghost` (dashed) for an invitee who hasn't joined.
- Initials only, no photos: COR is a work tool and initials stay legible in both themes.
- Stacks show at most four, then "+N more" as a `cor-tag`.
- Always pair with the name nearby or a tooltip; `aria-label` with the full name when alone.
