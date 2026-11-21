## Project rules

- Access control lives in the database (`has_permission`, `can_manage_role`, RLS, hierarchy-checked RPCs `set_user_role` / `set_user_active` / `submit_application`); `src/lib/access.ts` only mirrors it for UI decisions — change both together. Why: the browser can't be trusted.
- Base roles live in `public.user_roles` (one per user); custom roles via `user_role_assignments`. Never store roles on profiles. Why: prevents privilege escalation.
- Public SSR pages read through `src/lib/public.functions.ts` (publishable key + anon policies); the signed-in `/dashboard` area (`_authenticated`, ssr:false) uses the browser client under RLS. Why: SSR has no user session.
- Old-site accounts are kept in `public.legacy_users` and linked to a new account only when the same email is verified (auth.users triggers). Why: imported identities need proven email ownership.
- The query cache is shipped to the browser with the router's `dehydrate`/`hydrate` options in `src/router.tsx`, not `@tanstack/react-router-ssr-query` (its versions don't match the pinned router). Why: avoids hydration mismatches.
- Brand logos (socials, Roblox) come only from `src/components/site/brand.tsx` (`brandFor`, `RobloxIcon`), which matches platform name then link host; add new platforms there with a `--brand-*` token. Why: one place keeps logos consistent.
