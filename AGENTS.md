# Architecture
- Version new season workflows through nullable scheduling settings; null means legacy captain behavior, so existing competitions are never silently migrated.
- Use permission-checked, atomic database functions for V2 lifecycle, invitation, fixture and match mutations; keep client controls thin to prevent partial writes and bypassed agreements.
- Keep the existing wizard entry point and season routes; V2 replaces onboarding rather than creating a parallel application.- V2 table guards trust database-owner execution only, never caller-set configuration; direct legacy writes stay compatible while atomic RPCs enforce new agreements.
