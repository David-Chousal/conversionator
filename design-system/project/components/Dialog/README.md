# Dialog

A dialog holds a short, focused task that must finish or be cancelled before returning: invite members, name a saved view, confirm removing a data source.

- Structure: `cor-scrim` > `cor-dialog` (`role="dialog"`, `aria-modal`, labelled by its title) > head (title + close), body fields, `cor-dialog__foot` with Cancel then the primary key.
- Width 480px (`dialog`); the report composer is the one 640px dialog. Never stack dialogs.
- Focus moves to the first field on open, is trapped inside, and returns to the trigger on close. Esc and the close key cancel; ⌘⏎ submits.
- The primary key names the result ("Send invite", "Save view", "Remove Meta Ads"). Deleting stored data uses a hold-to-confirm key in the footer and says what will be deleted.
- Anything the user would want to read the dashboard alongside (drill-downs) is a Drawer, not a dialog.
- Focus moves to the element marked `data-autofocus` when the dialog opens (the invite dialog marks its Emails field), otherwise to the first focusable element; it is trapped inside and returns to the opener on close.
