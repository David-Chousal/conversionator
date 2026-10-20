# AlertFeed

The alert feed lists what alerts caught, newest first: on Settings › Alerts ("Recent alerts", last 14 days) and, later, from the bell in the top bar alongside sync failures.

- Row (`cor-feed__row`): a fixed 96px time column (mono; "Today", "Yesterday", then the date), then the outcome as a sentence with the actual value and threshold. Unread rows get a `flare` pennant once the bell exists.
- Write the headline as what happened, with numbers: "ROAS on Meta Ads dropped to 2.1× (below 2.5×)", "Leads on Google Ads rose 34% (more than 25%)". When the value would print the same as the threshold, show one more level of precision ("2.47× (below 2.5×)", "$1,900.40 (above $1,900)").
- Only active rules appear; pausing a rule removes its entries. Empty: "Nothing fired in the last 14 days."
- Opening an alert opens the Drawer scoped to that metric, channel and moment. Recovered alerts stay in the feed, read, with a "Recovered" line. The bell shows the unread count in a mono badge, capped at 9+.
