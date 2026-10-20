# LoginPanel

The login screen is the one place COR is allowed a big moment: an inverted art panel with the display headline and the signal bars, beside a plain form.

- Art panel: `ink` ground with `bg` text (it flips in dark mode), the wordmark, `display` headline, the platforms as a tag line, and four ascending blocks bled off the corner (`cobalt-soft`, `ch-2`, `cobalt`, `flare`). Hidden below 768px.
- Form: heading names the workspace when known ("Sign in to Northwind"), email, password with show/hide and "Forgot password?" in the label row, a full-width primary key.
- Wrong credentials: a `--failed` Banner above the fields that doesn't say which one was wrong, and `aria-invalid` on the password. Lock out after 5 attempts with a Banner giving the wait time.
- Forgot password swaps the form for one email field and "Send reset link", then confirms "If that email has an account, a link is on its way" whatever the result.
- No sign-up: accounts come from invitations (UC-005). Invite links land on a variant that sets name and password.
