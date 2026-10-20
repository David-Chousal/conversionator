# CrmPanel

The CRM panel is where a workspace connects HubSpot, in Settings › CRM & attribution. HubSpot is a CRM, not an ad platform, so it never appears on Connections or as a channel on Analytics.

- What it does: COR reads HubSpot contacts, lifecycle stages, deals and the ad each contact came from (original source drill-downs, UTMs and click IDs), then credits every lead, closed-won deal and its revenue to a platform, campaign and ad.
- Row: placeholder mark (replace with HubSpot's official logo), name with a `CRM` tag, account and record counts, SignalMeter over its schedule line ("Auto · next in 48m"; HubSpot syncs every hour on its own), Sync now and a ⋯ menu (Disconnect). Reconnect appears only when HubSpot access was revoked. Not connected: dashed mark and a primary Connect HubSpot key. Failed: Reconnect becomes the primary key and a `--failed` Banner gives the reason. First sync: ProgressRail counting contacts.
- Settings: Count a lead at (lifecycle stage: Lead, Marketing qualified lead, Sales qualified lead) changes how Analytics counts leads immediately. Count a conversion at is the closed-won deal stage. Attribution model is Last ad interaction.
- Connecting goes through HubSpot's own sign-in and returns to this panel; cancelling leaves a caution Banner. Disconnecting is hold-to-confirm in a Dialog that says contacts and deals will be deleted and Analytics returns to platform-reported numbers.
- Members see everything read-only, with an `--info` Banner saying only admins can change it.
