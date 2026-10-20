# AnalyticsPage

The Analytics page is the reference composition every data page follows: shell, top bar, page banners, the ChannelMixer, then bays on the 12-column grid.

- Top bar: page title, saved-view tabs, overall SignalMeter ("3 of 4 synced"), alerts bell, Customize key.
- Under the top bar: at most two page-level Banners for connection problems.
- First bay is always the ChannelMixer; every bay below reads its window and channels. Next comes the AttributionBay (or its platform-reported Banner).
- Default layout: four Readouts at 3 columns (with a CRM: Ad spend, Leads, Cost per lead, ROAS; without: Ad spend, Conversions, CPA, ROAS), Spend by channel TracePanel at 12, ReturnLedger and ShareRing at 6 each, then the Campaigns DataTable at 12.
- `space-8` between rows of bays, `space-6` between columns, `space-6` page gutter.
