# DataTable

The data table is where every number can be checked row by row: campaigns, ads, records on the Data tab, members, drill-down contributors.

- Structure: `cor-table-wrap` (scrolls sideways on its own) > `cor-table`. Header cells are mono tags on a `line-strong` rule; rows have `line` rules and no zebra striping or cell borders.
- Numeric columns get `class="n"`: right-aligned mono with tabular figures. Abbreviate in headers (Impr., Conv.) but never in cells except millions (2.31M).
- Sorting: header text is a button; the sorted column sets `aria-sort` and shows ▲/▼. Default sort is spend, descending.
- First column holds the name, a mono `.sub` line (ID or channel code) and an optional checkbox for selection; selected rows go `cobalt-soft` and a bulk bar appears in the bay head (Compare, CSV).
- An optional `cor-minibar` in the channel color shows each row's share of the column.
- `tfoot` totals sit on a 2px `rail` and must equal the matching Readouts exactly.
- Paging: 25 rows, `cor-pager` with "Rows 1–25 of 312". Sticky header; first column sticky when the table scrolls sideways. Row click opens the Drawer.
