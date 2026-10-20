# AlertBuilder

Alert rules are written as a sentence the user completes by filling slots, so a rule always reads back in plain English.

- Sentence: "When [metric] on [all channels | a channel] [rises above | drops below | changes by more than] [value] [in a day | over a week], [tell me in-app | email me | post in Slack] [#channel]." For workspace alerts the delivery reads "tell the workspace in-app" / "email the admins".
- Slots are native `<select>` and `<input>` elements with the `cor-slot` class (a drawn chevron on selects), so they work with the keyboard, screen readers and phone pickers. Each connecting word stays on a line with its slot (`cor-sentence__part`), so the sentence wraps cleanly. Unfilled slots are `--empty`; a slot turns `--invalid` once it's been left with a problem, with a `cor-help--error` line under the sentence. The value slot shows its unit: currency symbol before money, × after ROAS, % after a change.
- Metrics follow the attribution source (Deals won and Cost per deal with a CRM). Leads and Cost per lead are listed but disabled without a CRM ("needs HubSpot").
- Validation: every slot filled; value above 0, whole for counts, 1–1,000% for changes; Slack needs a channel. Leaving the Slack slot adds a missing `#` and lowercases it.
- Save stays disabled until every slot is valid. Beside the keys, a `cor-tag` backtests the rule on the last 30 days ("Would have fired 8 times in the last 30 days").
- Firing is edge-triggered: a rule fires on the day its condition starts holding, not on every day it stays true. Weekly rules use the trailing seven days; change rules compare with the period before. Days with no data are skipped, never read as zero.
- Admins choose "Just me" or "Everyone in the workspace"; members only write personal alerts ("Personal alert · only you get it").
- The rule list below is a `cor-alert-table` with fixed columns: an ON/OFF Switch (pause, toasts), the sentence with "Workspace · Dakota G." or "Personal", the last 30 days ("Fired 4× · last Oct 18", "Hasn't fired in 30 days", "Paused"), then Edit (reopens the builder) and hold-to-delete. Everyone sees workspace alerts; only admins change them. Personal alerts are visible to and managed by their owner only. On phones the history and keys stack under the sentence.
