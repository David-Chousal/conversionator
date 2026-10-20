# TokenInput

A token input holds several values in one field: report recipients, report metrics, campaign filters.

- Structure: `cor-tokens` containing `cor-token`s (label + remove button with `aria-label`) and a trailing `<input>`.
- Enter, comma or paste commits a token; Backspace in an empty input selects then removes the last token.
- Invalid tokens stay in place as `cor-token--invalid` (dashed `negative`) with a `cor-help--error` line naming the bad value, so nothing the user typed is lost.
- When values come from a fixed list (metrics), open a `cor-menu` of matches under the field as the user types.
- Put the count and limit in the hint ("3 of 20").
