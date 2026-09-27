# Launch Checklist — Restore v1.0.0

## Current plan: free-APK validation sprint first, Play Store second

Validate with a free sideloaded APK (real users, real payments via unlock
codes) before paying the $25 Play fee. Then do the full Play Store launch.

## Phase A — Free APK validation sprint (in progress)

### A1. App code — AI (done, verified 2026-09-26)
- [x] Expo SDK 57 + TypeScript app: onboarding, home, picker, camera,
      processing, before/after slider, paywall, settings, legal, recents.
- [x] `npx tsc --noEmit` passes; `expo-doctor` 21/21; iOS bundle export works.
- [x] Real AI wired: `microsoft/bringing-old-photos-back-to-life`
      version `c75db81db6cbd809d93cc3b7e7a088a351a3349c9fa02b6d393e35e0d51ba799`
      (verified on Replicate 2026-09-26). Token resolution: baked-in
      `EXPO_PUBLIC_REPLICATE_TOKEN` env var first, then Settings → SecureStore.
- [x] RevenueCat (`react-native-purchases` v10) wired with `pro`
      entitlement; falls back to a local mock when no API key / in Expo Go.
- [x] Sprint unlock codes: `src/lib/unlockCodes.ts` (offline checksum
      validation) + `scripts/generate-codes.mjs`; 200 codes minted at
      `workspace/your_files/restore-unlock-codes.txt`; "Have an unlock code?"
      entry on the paywall.
- [x] Android package `app.restore.photos`; `eas.json` with
      development/preview (APK) and production (AAB) profiles.

### A2. Accounts only you can create — YOU
- [ ] **Expo account** (free) at expo.dev → Account settings → Access Tokens
      → create a token → paste it to AI in chat (used once to run your cloud
      build; you can delete it right after).
- [ ] **Replicate account** at replicate.com — sign up (free, no card needed:
      new accounts get roughly $5–10 in free credits, enough for hundreds of
      restorations at ~$0.002–0.01 per photo — more than the whole sprint).
      API tokens → create a token. You keep it — you'll paste it into the
      app's Settings after installing (it never goes into the APK).

### A3. Build the APK — AI (needs A2)
```bash
EXPO_TOKEN=<paste> eas build --platform android --profile preview --non-interactive
```
- [ ] APK built on EAS (free tier) and download link delivered.

### A4. Test on your Android — YOU
1. Open the APK link on your Android → download (tap "Download anyway"
   if Chrome warns).
2. Tap the downloaded file → allow "Install unknown apps" for Chrome → Install.
3. Open Restore → Settings → AI setup → paste your Replicate token → Save.
4. Restore an old family photo end-to-end; check the before/after slider.

### A5. Sprint with real users — YOU
- [ ] **Stripe account** (free) → create a payment link (e.g. $19 "founding"
      lifetime) to collect money outside the app.
- [ ] Share the APK + before/after videos (TikTok/Reels/WhatsApp).
- [ ] When someone pays, send them one code from
      `restore-unlock-codes.txt`; they tap "Have an unlock code?" on the paywall.
- [ ] Goal: prove strangers will install AND pay before spending the $25.

### Sprint security notes
- The Replicate token is NOT baked into the sprint APK (it lives only in your
  phone's secure storage). If you later bake it in for wider sharing, anyone
  can extract it — set a Replicate spending limit and move to a backend
  before the Play launch.
- Unlock codes are offline-validated and shareable — fine for a sprint of
  dozens of users, not for production. Real Play billing replaces them.

## Phase B — Google Play launch ($25 one-time) — after the sprint validates

### B1. Accounts — YOU
- [ ] **Google Play developer account** — $25 one-time at
      play.google.com/console (government ID verification, 1–3 days).
- [ ] **RevenueCat account** (free under $2,500/mo revenue) at revenuecat.com:
      add your Play app, create the `pro` entitlement, attach products, build
      an offering with all three packages. Paste the public SDK key as the
      `EXPO_PUBLIC_REVENUECAT_KEY` EAS secret.
- [ ] New personal Play accounts must run a **14-day closed test with 12+
      testers** before production unlocks — plan ~3–4 weeks from $25 to live.

### B2. Store products — YOU (AI guides)
Create in Play Console with EXACTLY these product IDs (the app expects them):
- [ ] Subscription `restore_weekly_699` — $6.99/week, 3-day free trial
- [ ] Subscription `restore_annual_3999` — $39.99/year
- [ ] One-time product `restore_lifetime_9900` — $99

### B3. Build & submit — AI runs, YOU own the accounts
```bash
eas build --platform android --profile production   # AAB, auto version bump
eas submit --platform android                        # needs Play service-account key
```
- [ ] Production AAB built, uploaded, listing filled, review passed.

## Phase C — App Store later ($99/year) — YOU when ready
- [ ] Apple Developer Program ($99/year), then repeat B2–B3 for iOS.

## Still outstanding (any phase)
- [ ] Final app icon / splash / adaptive icon (template assets in use).
- [ ] Store screenshots (before/after pairs) + final listing copy.
- [ ] Hosted privacy-policy URL (legal text in `src/app/legal.tsx` is a draft —
      get it reviewed before publishing).
- [ ] Ask-for-rating prompt after 2nd restore (NOT yet implemented).
- [ ] Free-tier quota (3/day) + watermark (copy mentions them; NOT enforced).
- [ ] Production analytics / crash reporting.

## What the MVP deliberately does NOT include
Full photo editor, filters, accounts/login, cloud backup, push notifications.
Ship the wedge (restoration), then let paying users tell you what's next.
