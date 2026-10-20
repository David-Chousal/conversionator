# Switch

A switch turns something on or off immediately, with its state printed beside it (ON / OFF) so it reads without color.

- Structure: `<label class="cor-switch"><input type="checkbox" role="switch"><span class="cor-switch__state">ON</span></label>`; the consumer updates the state word with the value.
- Used on Data tab dataset rows ("pull this dataset"), alert rules (active / paused), notification preferences.
- Changes apply on toggle and confirm with a toast ("Search terms will sync on the next run"). If turning something off deletes data, use a hold-to-confirm Key instead.
- Name the thing being switched, not the action: "Search terms", not "Enable search terms".
