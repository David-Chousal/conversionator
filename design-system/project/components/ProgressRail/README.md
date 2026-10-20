# ProgressRail

A progress rail shows how far a long job has got: first sync of a platform, manual sync, report export.

- Structure: `cor-progress` > `cor-progress__meta` (what is running as a `cor-tag`, the count in mono) > `cor-progress__track` (`role="progressbar"` with `aria-valuenow`) > `<b style="--p:52%">`.
- Always show real units (rows, pages), never a bare percentage.
- Jobs under 2 seconds show no progress; jobs of unknown length use the Key busy state instead.
- When done, the rail is replaced by a toast with the result.
