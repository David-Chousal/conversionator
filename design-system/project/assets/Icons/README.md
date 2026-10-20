COR's own icon set: 26 glyphs drawn on a 16px grid with a 1.5px stroke, square caps and mitred joins, to match the square-shouldered keys and rails.

- Ink: the files are drawn in `ink` light (#11181b). In the app, inline the path and set `stroke: currentColor` so icons take `ink`, `ink-muted` or `cobalt` from their context (the `cor-ico` class does this).
- Sizes: 16px in UI, 20px (`cor-ico--20`) in the sidebar and empty states. Never scale strokes; at 20px keep the 1.5px stroke.
- Sidebar: `analytics`, `connections`, `data`, `reports`, `team`, `settings`. Actions: `sync`, `export`, `plus`, `close`, `more`, `drag`, `search`, `filter`, `calendar`, `layout`. State: `check`, `warning`, `info`, `lock`, `bell`.
- Icons accompany words; an icon-only key needs a tooltip and an `aria-label`.
- Need a glyph that isn't here? Draw it on the same grid and add it; don't mix in another icon library.
