# ConnectionRow

A connection row is one ad platform on the Connections page: who it is, how healthy its signal is, how much of it COR pulls, and the one action it needs now.

- Columns: platform mark, name + channel code + account line (mono), SignalMeter, datasets pulled ("4 of 6"), actions. Grid template: `32px minmax(0,1fr) 216px 96px 176px`: only the platform column flexes, so Signal, Datasets and actions line up in every row and in both the Connected and Available sections whatever each row's key says. Below 768px: `32px 1fr 96px`, with signal and datasets on a second line and actions on a third.
- `cor-mark` is a placeholder monogram tile. Replace it with the vendor's official logo (from its brand kit) at 20px inside the same 32px tile; never redraw a vendor logo.
- Set and forget: every healthy connection syncs automatically every hour, and access tokens renew in the background a week before they run out. The signal cell shows the SignalMeter over its schedule line ("Auto · next in 56m"). States and their one action: Synced or Stale → Sync now (stale means two scheduled runs were missed; COR keeps retrying, so it never asks for a reconnect); Failed (access revoked on the platform's side, the only case that needs a person) → Reconnect as the primary key with the reason in `negative` on the account line; First sync → Progress
- Connect and Reconnect send the admin to the platform's own sign-in (OAuth). COR never sees the password. Cancelled or denied authorization returns here with a caution Banner: "Google Ads wasn't connected. You cancelled at Google's sign-in."
- The ⋯ menu holds Sync now, Manage datasets, Open in platform, and Disconnect (hold-to-confirm in a dialog that says stored data will be deleted).
- Members see the list without actions.
- Only ad platforms (where spend happens) are connections. A CRM such as HubSpot is not a channel: it connects in Settings › CRM (see CrmPanel), and the Connections page says so in one line under the list.
