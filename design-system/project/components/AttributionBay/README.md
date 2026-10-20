# AttributionBay

The attribution bay sits under the ChannelMixer on Analytics and says where the board's conversions, revenue and leads come from.

- With a CRM: a bay titled Attribution. Its scope tag names the CRM, the model (Last ad interaction) and the lifecycle stage that counts as a lead. A strip shows attributed leads in `cobalt` against unattributed ones hatched (hatch = "not in these numbers"), and one sentence gives the real counts and percentage.
- Unattributed means CRM contacts who never clicked an ad (organic search, email, direct). They are never spread across channels.
- Without a CRM: an `--info` Banner instead, explaining that numbers are platform-reported and can overlap, with Connect HubSpot linking to Settings › CRM.
- While the CRM's first sync runs: an info Banner saying numbers switch to the CRM's attribution when it finishes.
- If the CRM stops syncing: a `--failed` Banner inside the bay; numbers cover up to its last sync.
- HubSpot is never a channel here: it never appears in the mixer, the ledger, the share ring or the traces.
