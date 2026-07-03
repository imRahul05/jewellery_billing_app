# Admin Header User Menu Design

## Scope

Replace the admin header's static user display with a dropdown matching the business portal user-menu pattern. Keep the existing control-panel label, super-admin session indicator, theme toggle, server-side session validation, and user lookup unchanged.

## Component design

Add a focused client component under `components/admin` that accepts the resolved admin display name. Its trigger uses the existing ghost button, user icon, truncated name, and shared dropdown primitives used by the business topbar.

The menu displays the admin name as its label, followed by a separator and a `Log out` item with the existing logout icon treatment. The admin layout remains a server component and renders this client component in place of the static user block.

## Logout flow

Selecting `Log out` awaits `authClient.signOut()`, then navigates to `/login` with `router.push`, and calls `router.refresh()` so protected server-rendered routing is reevaluated after the session is cleared.

## Error behavior

Navigation occurs only after `signOut()` resolves, matching the business portal behavior. No additional error UI or unrelated authentication behavior is introduced.

## Verification

Add a focused source-level regression test consistent with the repository's existing lightweight component checks. It will verify that the admin layout uses the new menu and that the client component contains the required sign-out, login redirect, route refresh, admin-name label, and logout item wiring. Run that test, the relevant existing tests where practical, lint, and TypeScript/build validation as supported by the project.
