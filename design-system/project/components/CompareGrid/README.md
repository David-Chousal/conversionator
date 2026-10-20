# CompareGrid

The compare grid puts 2–4 campaigns or ads from any platforms side by side, one column each, so the user can see which channel or creative performs best.

- Opened by selecting rows in a DataTable and pressing Compare, or from a ledger row. Columns are items; rows are metrics in a fixed order: Spend, Impressions, CTR, CPC, Conversions, CPA, ROAS.
- Column head: platform mark, channel code and the item name. Ads add a 48px creative thumbnail above the name.
- Each cell shows the value and a bar scaled within its row (longest = 80px). The best value per row gets `is-best` (◆ in `cobalt`, medium weight). "Best" respects direction: lowest CPA and CPC win.
- Spend has no best. Missing metrics (a platform doesn't report it) show "—" with a tooltip saying why.
- Remove a column from its head menu; add one with a "+ Add" column that opens a campaign search.
