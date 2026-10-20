# Numbers, dates and units

Every number in COR is formatted by one shared function per kind, so the same value reads the same everywhere: tiles, tables, tooltips, exports and alerts.

## Money

- Currency comes from the workspace setting (USD default). Show the symbol, never the code, except in CSV exports, which carry a currency column.
- Readouts and tables: whole dollars above $100 ("$48,210"), cents below ("$18.62", "$0.99"). CPC, CPA and CPM always keep cents.
- Compact form for ledgers, rings, axis ticks and chart labels: one decimal with k / M ("$21.4k", "$1.2M"). Never compact a value in a table cell or a Readout.
- Negative money uses a true minus: "−$2.10". Deltas always carry a sign: "+$410", "−$2.10".

## Ratios and rates

- Percentages: one decimal ("12.4%"); CTR and conversion rate two decimals ("2.41%") because they are small.
- ROAS: one decimal with ×, no space ("4.1×"). Never show ROAS as a percentage.
- Changes in a percentage are percentage points: "+0.6 pts", not "+0.6%".
- Counts: grouped thousands ("18,404"); compact only past a million ("2.31M"). Leads and deals are counts.
- Cost per lead and cost per deal keep cents ("$11.52"), like CPA.

## Missing and zero

- No data: an em dash "—" with a tooltip saying why ("LinkedIn doesn't report view-through conversions").
- Zero is a real value and shows as "0" or "$0".
- Division by zero (CPA with no conversions): "—", never "∞" or "$0".

## Dates and times

- Everything shows in the user's time zone (Settings › General); the zone abbreviation appears in tooltips and exports ("9:42 AM PT").
- Ranges use an arrow: "Mar 1 → Mar 30". Add the year only when it isn't the current year or the range crosses years.
- Relative times under 24 hours, mono and terse in tags ("4m", "6h") and in words in sentences ("4 minutes ago"). After 24 hours use the date ("Mar 28").
- Axis dates are uppercase mono ("FEB 3"). Weeks start Monday unless the workspace says otherwise.

## Names and codes

- Channels: "CH·01 Google Ads". The code is fixed at connection time and never reused.
- Campaign and ad IDs in mono `.sub` lines, never truncated in the middle.
- Truncate long names at the end with an ellipsis and show the full name in a tooltip.
