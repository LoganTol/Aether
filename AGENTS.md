# Architecture
- Keep pre-confirmation schedule previews as read-only planning projections using the shared round-robin generator and pending invites; only the protected fixture operation creates actual matches and activates seasons.
- Own planning-preview state in the season page and render it in Schedule; clear it on roster refresh so stale invitations never become fixtures. Use presentation-only capitalization for headings and buttons so stored names and input values remain unchanged.
- Save named creation and overview invitations atomically through wrappers around existing draft/invite operations; acceptance uses the invited name even through a shared link without confirming membership early.
- Version new season workflows through nullable scheduling settings; null means legacy captain behavior, so existing competitions are never silently migrated.
- Use permission-checked, atomic database functions for V2 lifecycle, invitation, fixture and match mutations; keep client controls thin to prevent partial writes and bypassed agreements.
- Keep the existing wizard entry point and season routes; V2 replaces onboarding rather than creating a parallel application.- V2 table guards trust database-owner execution only, never caller-set configuration; direct legacy writes stay compatible while atomic RPCs enforce new agreements.
