# ReturnLedger

The return ledger is COR's signature view: each channel's spend runs left from a spine and its attributed revenue runs right, on the same dollar scale, so return is visible as length.

- Structure: a `cor-bay`, then `cor-ledger` rows of `cor-ledger__name`, `cor-ledger__spend`, `cor-ledger__ret` and `cor-ledger__roas`, then a total `cor-tag`.
- Spend bars are hatched `ink-muted` (money out); return bars are solid in the channel's `ch-n` (money back). The spine is the `rail`.
- One scale for both sides: the spend track is 1.6fr and the return track 4fr, so pick a full-scale value R for the return track (the largest revenue, rounded up) and set return `--w` = revenue ÷ R and spend `--w` = spend ÷ (0.4 × R).
- Values in `metric`, abbreviated to one decimal ($21.4k). A label that would run off the track sits inside the bar end with class `in`.
- Highlight only the best ROAS in `positive`. Sort rows by spend, largest first.
- The return side is HubSpot's closed-won revenue when a CRM is connected, and each platform's own conversion value otherwise; the bay's scope tag always says which ("HubSpot closed-won revenue" or "platform-reported conversion value").
