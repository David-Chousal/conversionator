# LayoutEditor

Layout edit mode lets a user add, remove, move and resize bays on Analytics and save the arrangement as a named view.

- What is editable: the bay grid only. The ChannelMixer and the AttributionBay stay fixed above it, because they decide what every bay shows.
- Saved views are Tabs directly above the grid, with "+ New view"; the Customize key (E) sits at the right end of that row. The active view is in the URL (`?view=growth`) next to the filters, so a view and its filters can be linked together. Views are personal to each user.
- Customize pins an inverted `cor-editbar` above the grid: "Editing layout · {view}", an "Unsaved changes" tag once anything moves, Reset to default, Delete view (not on Default), Cancel (Esc), Save view (⌘S). Nothing saves until Save view; Cancel restores the saved layout.
- Each bay gets a bar above its content: a drag grip, its name, its width as a tag ("6 / 12"), and a remove key. The content itself goes inert (no clicks, no focus) while editing. A `cobalt` corner handle resizes, snapping to the widths that bay allows (readouts 3/4/6, trace and ledger 6/12, share 4/6, campaigns 12).
- Pointer: drag the grip and the bays reorder live as you pass over them; the lifted bay takes `surface` and `shadow-pop`. Keyboard: focus the grip, Space or Enter picks up, arrows move one place, Space drops, Escape puts it back. Every step is announced in an assertive live region ("Spend by channel moved to position 3 of 8"). The resize handle is a slider: Left and Right step through the allowed widths.
- The right rail is the bay library: a mini glyph, name, description and widths for each bay, and an Add key. Readouts are listed once per metric (Ad spend, Leads, Cost per lead, Deals won, Cost per deal, ROAS with a CRM; Ad spend, Conversions, CPA, ROAS without). Anything already on the board shows its Add key disabled with "Already on the board". New bays go to the top. Below 1024px the library drops under the grid.
- The Default view follows the system layout (which changes with the attribution source) until someone saves it. Reset to default asks once in a Dialog and restores the system layout into the draft; saving an unchanged Default keeps it following the system.
- A readout for a CRM-only metric (Leads, Cost per lead) in a workspace without a CRM keeps its place and says so, with Connect HubSpot linking to Settings › CRM. A bay whose source is disconnected keeps its place and shows a Banner.
- Delete view is hold-to-confirm in a Dialog and returns to Default with the same filters.
