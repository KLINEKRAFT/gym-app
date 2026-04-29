# Gym App

A mobile-first fitness app built with Expo Router. One codebase ships to web (Cloudflare Pages) and iOS/Android (when you're ready to spin up native builds via EAS).

Built by KLINEKRAFT.

---

## Why this stack

Your blueprint asked for React Native. Your workflow is GitHub web editor → Cloudflare Pages auto-deploy from an iPhone. Vanilla React Native can't do that — it needs Xcode, simulators, and Metro bundler.

**Expo Router with React Native Web** solves it. Same `<View>` / `<Text>` / `StyleSheet` API, but it compiles down to a static web app (which Cloudflare Pages loves) and a native app (which the App Store wants). When you eventually want a real iOS app, run `eas build --platform ios` from any computer — no local Xcode needed.

## What's in here

```
app/
  _layout.tsx              Root layout, navigation stack
  index.tsx                Decides: onboarding vs dashboard
  onboarding.tsx           5-step onboarding flow
  (tabs)/
    _layout.tsx            Bottom tab bar (HOME / LIFT / FUEL / STATS / YOU)
    index.tsx              Dashboard
    lift.tsx               List of workouts in your plan
    fuel.tsx               Macro tracking + meal logging
    stats.tsx              Weight chart + achievements
    profile.tsx            Settings, regenerate plan, reset
  workout/[dayId].tsx      Active workout session w/ rest timer

lib/
  tokens.ts                Design system — colors, type, spacing
  workoutGenerator.ts      Real plan generator — exercise library + split logic
  macroCalculator.ts       Mifflin-St Jeor TDEE + goal-based macro split
  store.ts                 Zustand store — profile, plan, logs, XP

components/
  ui.tsx                   Card, Button, Eyebrow, Tag, ProgressBar, Stat, Divider
  KlinekraftFooter.tsx     Built-by-klinekraft footer w/ logo

assets/
  klinekraft-logo.png      Your logo
```

## Real logic, not just UI

- **Workout generator** — Picks exercises from a curated library based on `goal × experience × gymAccess`. Beginners get full-body 3x/week. Intermediates get PPL 4x. Advanced get PPL 6x. Compounds first, then isolation. Volume scales with goal (more sets on bulk, fewer on cut). Starting weights estimated from bodyweight ratios.
- **Macro calculator** — Mifflin-St Jeor BMR → activity multiplier → TDEE → goal offset (-20% cut, +10% bulk). Protein scales with bodyweight (1g/lb on cut, 0.8 on bulk). Fats floor at 0.3g/lb. Carbs fill the rest.
- **Barcode scanner** — Camera-based barcode scanning (EAN-13, UPC-A, Code 128, etc.) hitting the [Open Food Facts](https://openfoodfacts.org) database. Free, no API key, ~3M products worldwide. Returns name, brand, and macros per 100g; lets you adjust serving size before logging. Manual barcode entry available as fallback (and the only path on web).
- **Set logging** — Every completed set is persisted with a session ID. The Stats screen reads from this to compute monthly volume and workout count.
- **Workout export / share** — When you finish a session, generates a 9:16 social-ready summary card (volume, time, sets, exercises with top weight) and exports as PNG via the native share sheet.
- **Adaptive engine (phase 2)** — Hooks are in place. The current generator returns a static plan; phase 2 adjusts weights based on completed-set data.

## Brutalist signature: the rest timer

When you complete a set during a workout session, the entire screen flips to the electric-blue accent and shows a massive ticking countdown — no chrome, no UI, just the numbers. Tap anywhere to skip. This is the screenshot people share.

## Deploy to Vercel

The repo includes a `vercel.json` that wires everything up. You can do this entirely from the GitHub web editor on iPhone, then Vercel auto-deploys.

1. **Push this repo to GitHub.** Use a new repo under your `klinekraft` org, e.g. `gym-app`.

2. **Go to vercel.com → New Project → Import** the repo.

3. **Vercel will auto-detect the config.** The `vercel.json` already specifies:
   - Build command: `npm run build:web`
   - Output directory: `dist`
   - Install command: `npm install`
   - SPA fallback rewrite (so deep links like `/workout/day-0` work)

   You can leave all the auto-populated fields alone and just hit **Deploy**.

4. **First build runs `npm install` then `expo export --platform web`.** Static output lands in `dist/`. Vercel serves it from their global CDN.

5. **Custom domain:** Project Settings → Domains → add `gym.colinkline.com`. Vercel will give you DNS records to add in Cloudflare (an A record for the apex or CNAME for the subdomain). Set the Cloudflare record to **DNS only** (grey cloud) — proxying through Cloudflare on top of Vercel doubles up the CDN and breaks SSL. This is the same setup you used for the GitHub Pages screensaver sites.

### Why the rewrite matters

Expo Router uses client-side routing. Without the SPA fallback rewrite in `vercel.json`, any direct hit to `/fuel` or `/workout/day-0` (refresh, share link, deep link) would 404 because no static file exists at that path. The rewrite tells Vercel: "for any URL, serve `index.html` and let React handle routing." Standard SPA pattern.

### Heads up about Node version

Vercel defaults to Node 20 currently, which is what Expo SDK 51 wants. If you ever see build failures mentioning Node mismatch, set the version in Project Settings → General → Node.js Version, or add `"engines": { "node": "20.x" }` to `package.json`.

## Run it locally (when you're ready for that)

You don't need this to deploy, but if you ever want to preview before pushing:

```bash
npm install
npm run web         # opens at http://localhost:8081
```

For native:

```bash
npm run ios         # needs Mac + Xcode
npm run android     # needs Android Studio
```

## Build native apps without owning a Mac

Once you want to ship to the App Store / Play Store, use EAS Build:

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

EAS runs the build on Expo's cloud machines. You can do this from any computer (not just a Mac).

## Design system

Brutalist sport. Off-black canvas (`#0A0A0A`), volt-yellow accent (`#DBFF00`), sharp 4px corners, condensed display type, monospaced data. Touch `lib/tokens.ts` to retheme everything.

Two weights only: 500 regular, 900 black for display numbers. Eyebrow labels are mono, uppercase, tracked. Volt is reserved for: primary CTAs, the active tab indicator, key data points (today's calories left, weight delta), and earned achievements. Use it sparingly — that's where the energy comes from.

## Phase roadmap

The blueprint defines 6 phases. Here's what's built and what's not:

- **Phase 1 (MVP) — DONE.** Auth (skipped for now — local-only profile), profile setup, workout generator, workout logging, macro tracking, food logging, weight tracking.
- **Phase 2 (Smart systems)** — Hooks are stubbed in `store.ts`. The adaptive workout adjustment, weekly check-ins, and progress reports are next.
- **Phase 3 (Engagement)** — Streaks counter is wired (just needs a daily-check job to increment). XP is computed per logged set. Achievements scaffold is in `stats.tsx`.
- **Phase 4 (Social)** — Not built. Will need a real backend (next step is probably Supabase or Cloudflare D1 + Workers).
- **Phase 5 (Premium)** — Not built. Subscription gating goes in `lib/store.ts`.
- **Phase 6 (Gym integration)** — Not built. QR check-in needs a partnership.

## Auth (deliberately deferred)

The blueprint specifies Firebase or Auth0. I left auth out of the MVP because:

1. The app is fully usable with local-only persistence (AsyncStorage on native, localStorage on web).
2. Adding auth before there's a backend to talk to is over-architecting.
3. When you do add it, you've got a few clean options on Vercel:
   - **Clerk** or **Auth0** — drop-in auth UI, both have generous free tiers
   - **NextAuth / Auth.js** — if you migrate to a Next.js shell wrapping Expo Router
   - **Supabase** — gives you auth + a Postgres database in one go, plays nicely with Vercel
   - **Cloudflare Workers + D1** — cheaper at scale, but adds a second platform to manage

When you're ready, the cleanest seam is `setProfile` in `lib/store.ts`. Wrap it with a sync-to-server call.
