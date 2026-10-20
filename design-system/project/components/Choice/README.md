# Choice

Checkboxes pick any number of options from a short list; radios pick exactly one and explain each option inline.

- Structure: `<label class="cor-check"><input type="checkbox|radio"><span>Label</span></label>`, grouped in a `<fieldset>` with a `cor-tag` legend.
- Checkboxes are square (`radius-sm`), radios round; checked fills `cobalt`.
- Use radios when each option needs a sentence (roles); use a SegmentedControl when labels are one word.
- On/off settings that take effect immediately use a Switch, not a checkbox.
