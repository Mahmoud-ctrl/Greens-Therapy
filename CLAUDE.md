# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — dev server at http://localhost:3000 (also regenerates `AGENTS.md`)
- `npm run build` — production build (also the main type check; there is no separate `tsc` script)
- `npm run lint` — ESLint 9 flat config (`eslint.config.mjs`, `eslint-config-next`)

There is no test suite.

Required env vars (in `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Both Supabase client factories throw if they are missing.

## Stack notes

- Next.js 16.4 / React 19.3 — newer than most training data. Read `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).
- `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and `experimental.agentFeedback`; Tailwind v4 runs through a custom Turbopack CSS loader rule (`@tailwindcss/turbopack`), not PostCSS.
- Path alias `@/*` → repo root.
- `stripe` is a dependency but is not used anywhere yet. `data/products.ts` and `data/treatments.ts` are seed/static data not imported by the app (live data comes from Supabase).

## Architecture

**Almost everything is client-side.** Pages under `app/` are `"use client"` components; the root layout (`app/layout.tsx`) wraps the whole app in nested client providers, and their order matters:

`AuthProvider` → `ClinicDataProvider` → `LocaleProvider` → header / page / footer

- **`components/auth/auth-provider.tsx`** — Supabase auth session via the browser client. `AppUser.role` (`admin | receptionist | patient`, see `lib/auth.ts`) is read from the JWT `app_metadata.role`; anything else is treated as `patient`.
- The public site is browsable without an account; only booking needs one (`/book` shows a sign-in prompt to logged-out visitors). Registration signs the user in immediately — this relies on "Confirm email" being disabled in Supabase Auth settings.
- **`components/auth/require-auth.tsx`** — client-side role guard; `app/dashboard/layout.tsx` restricts `/dashboard/*` to admin/receptionist and redirects others to `/admin` (the staff login page). There is no middleware/proxy — real authorization is enforced by Supabase RLS.
- **`components/providers/clinic-data-provider.tsx`** — the single data layer (`useClinicData()`). It loads treatments, products, `clinic_settings` and appointments from Supabase and exposes all mutations (CRUD, stock adjustments via `inventory` inserts, booking via the `create_appointment` RPC, slot lookup via `get_booked_appointment_slots` RPC). Add new data access here rather than calling Supabase from pages.
  - Not everything is in Supabase: **cart, product orders, and the clinic logo live only in `localStorage`** (synced across tabs via `useSyncExternalStore` + a custom `clinic-local-storage-change` event).
- **`components/providers/locale-provider.tsx`** — bilingual Arabic/English. Default locale is `ar` (RTL; `<html lang="ar">`), persisted in `localStorage`. There is no i18n library: components branch on `locale` inline, and DB rows carry paired columns (e.g. `name_en` / `name_ar`). Helpers in `lib/i18n.ts`. User-facing strings must be provided in both languages.
- `lib/supabase/client.ts` (browser) and `lib/supabase/server.ts` (server, cookie-based) are the only Supabase client factories. `lib/supabase/auth-errors.ts` maps Supabase auth errors to localized messages.
- Shared domain types are in `types/clinic.ts`; `lib/clinic-contact.ts` holds the clinic WhatsApp number used to build booking confirmation links.

## Styling

- Brand theme lives in `app/globals.css`. The markup uses Tailwind's `emerald-*` / `slate-*` names everywhere (dashboard included); `@theme` remaps them to the brand's olive greens and warm stone, and adds a `honey-*` accent scale. Change colors there, not per component.
- Shared classes in `globals.css`: `btn-primary`, `btn-secondary`, `field` (inputs), `eyebrow`, `surface-card`. Headings use `font-display` (Cormorant Garamond for Latin, Amiri for Arabic, loaded via `next/font` in `app/layout.tsx`).
- Reusable pieces: `components/ui/section-shell.tsx` (`SectionShell`, `PageHeader`, `EmptyState`, `CardSkeletons`), `components/catalog/*-card.tsx`, `components/ui/item-visual.tsx` (category illustration when an item has no `image_url`), `components/auth/auth-layout.tsx` (login/register/staff forms).
- Use logical properties (`ms-`, `me-`, `start-`, `end-`, `text-start`) so layouts flip correctly in RTL. Give `<fieldset>`/grid children that contain horizontal scrollers `min-w-0`, or they widen the whole page on mobile.
- If CSS edits don't show up in `next dev`, restart the dev server; a production build (`npm run build`) always reflects the current `globals.css`.

## Database (Supabase)

Schema lives in `supabase/migrations/` (timestamped SQL; add new migrations rather than editing applied ones). `supabase/seed.sql` holds dummy treatments, products (stock via `inventory`) and clinic hours; run it in the Supabase SQL editor — it only fills empty tables. Key points spread across the migrations:

- RLS on all tables; role checks use `public.current_app_role()` (reads JWT `app_metadata.role`). Staff roles are set in Supabase `app_metadata`, not in app code.
- Business rules live in the DB: triggers snapshot treatment data onto appointments, apply `inventory` deltas to product stock, sync `patient_profiles` from `auth.users`, and validate appointments against clinic hours (`check_appointment_schedule`). `clinic_settings` is a single-row table (`id = true`).
- Patients book only through the `create_appointment` RPC; booked slots are exposed via `get_booked_appointment_slots` without leaking other patients' data.
