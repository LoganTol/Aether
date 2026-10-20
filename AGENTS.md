# Architecture
- Finalize new draft schedules through the atomic single-action launch RPC; materialize invitation placeholders without confirming membership, then claim those same participant IDs on acceptance to preserve fixtures.
- Version direct match scheduling with a default-false season setting so existing agreements remain unchanged; list and round-robin bracket views share persisted match cards and the same protected editor. Use presentation-only capitalization so stored names and input values remain unchanged.
- Save named creation and overview invitations atomically through wrappers around existing draft/invite operations; acceptance uses the invited name even through a shared link without confirming membership early.
- Version new season workflows through nullable scheduling settings; null means legacy captain behavior, so existing competitions are never silently migrated.
- Use permission-checked, atomic database functions for V2 lifecycle, invitation, fixture and match mutations; keep client controls thin to prevent partial writes and bypassed agreements.
- Keep the existing wizard entry point and season routes; V2 replaces onboarding rather than creating a parallel application.- V2 table guards trust database-owner execution only, never caller-set configuration; direct legacy writes stay compatible while atomic RPCs enforce new agreements.
