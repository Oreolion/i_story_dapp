# Production TODO — Mobile App (Android First)

Sorted by priority. Work in `i_story_mobile/mobile/`.

---

## BLOCKERS (Must fix before Play Store submission)

### 1. App Icons & Splash Screen
- [ ] Generate real app icons (replace Expo defaults)
  - Need: 1024x1024 master icon
  - `app.json` → `expo.icon`, `expo.android.adaptiveIcon.foregroundImage`
  - Use `@expo/configure-splash-screen` or manually set `expo.splash`
- [ ] Create splash screen assets
  - Need: splash image matching brand (dark bg + eStories logo)

### 2. EAS Build Production Profile
- [ ] Fix `eas.json` production profile:
  ```json
  {
    "build": {
      "production": {
        "android": {
          "buildType": "app-bundle"
        },
        "env": {
          "API_URL": "https://estories.app"
        }
      }
    }
  }
  ```
- [ ] Update ALL API URLs from `e-story-dapp.vercel.app` → `estories.app` (after DNS setup)
- [ ] Generate upload keystore for Play Store signing
- [ ] Test production build: `eas build --platform android --profile production`

### 3. Account Deletion Flow
- [ ] Add "Delete Account" button to profile/settings screen
- [ ] Call `DELETE /api/user` endpoint (needs to be created on web side too)
- [ ] Clear local data (secure store, cached stories)
- [ ] Sign out after deletion
- **Required by**: Google Play policy, GDPR

### 4. Privacy Policy & Terms Links
- [ ] Add links to privacy policy and terms in:
  - Login screen (footer)
  - Signup screen (footer)
  - Settings/profile screen
- [ ] URL: `https://estories.app/privacy` and `https://estories.app/terms`
- **Required by**: Google Play, Google OAuth

### 5. Google Play Store Listing
- [ ] Create Google Play Developer account ($25 one-time)
- [ ] Prepare store listing:
  - App name: "eStories"
  - Short description (80 chars): "AI-powered storytelling. Write, record, analyze, and own your stories."
  - Full description (4000 chars)
  - Screenshots: at least 2 phone screenshots (min 320px, max 3840px)
  - Feature graphic: 1024x500 PNG
  - App category: "Books & Reference" or "Productivity"
- [ ] Complete Data Safety form (references privacy policy)
- [ ] Complete Content Rating questionnaire (IARC)
- [ ] Set target audience: 13+

---

## HIGH PRIORITY (Before public beta)

### 6. Error Handling & Crash Reporting
- [ ] Add error boundaries around major screens
- [ ] Consider adding Sentry (`@sentry/react-native`) for crash reporting
- [ ] Handle network errors gracefully (offline toast, retry buttons)

### 7. Loading & Empty States
- [ ] Add skeleton loaders for story lists (already have `SkeletonLoader` component)
- [ ] Add empty state UI for:
  - Empty library ("No stories yet — start writing!")
  - Empty collections ("Create your first collection")
  - No notifications
  - No search results

### 8. Testnet Disclaimer
- [ ] Add testnet banner/badge on wallet-related screens
- [ ] Text: "Testnet Mode — No real assets involved"
- [ ] Remove before mainnet launch

### 9. Deep Linking
- [ ] Configure `app.json` intent filters for `estories.app/story/*` links
- [ ] Test deep link handling in `_layout.tsx` notification handler

### 10. Push Notification Refinement
- [ ] Test push notifications on real Android device
- [ ] Handle notification permissions gracefully (explain why before asking)
- [ ] Add notification preferences screen (optional)

---

## MEDIUM PRIORITY (Post-launch polish)

### 11. Offline Support
- [ ] Cache last-fetched stories for offline reading
- [ ] Queue story saves when offline, sync when back online
- [ ] Show offline indicator banner

### 12. Performance
- [ ] Profile FlatList rendering on story lists (should use `getItemLayout` for fixed-height items)
- [ ] Optimize image loading (use `expo-image` with caching)
- [ ] Reduce bundle size — check if all `lucide-react-native` icons are needed

### 13. Accessibility
- [ ] Add `accessibilityLabel` to all touchable elements
- [ ] Test with TalkBack (Android screen reader)
- [ ] Ensure color contrast meets WCAG AA

### 14. Testing
- [ ] Add unit tests for critical hooks (`useCollections`, `useWalletGuard`, auth flows)
- [ ] Add integration tests for onboarding flow
- [ ] Test on multiple Android versions (API 24+)

### 15. Blockradar Payment Integration
- [ ] Integrate Blockradar SDK/API for subscription payments
- [ ] Add payment flow to pricing screen (currently just display)
- [ ] Handle payment confirmation and subscription state
- [ ] Store subscription status in auth store

### 16. App Updates
- [ ] Add in-app update prompt (expo-updates or Play Store in-app updates)
- [ ] Configure OTA updates via EAS Update

---

## Files to Update When Domain Changes

When `estories.app` DNS is live, update these mobile files:

| File | What to change |
|------|---------------|
| `eas.json` | All `API_URL` values |
| `lib/api.ts` | `BASE_URL` fallback |
| `lib/wagmi.config.ts` | `metadata.url`, `metadata.icons`, `redirect.universal` |
| `.env` | `API_URL` |

---

## Play Store Submission Checklist

Final checklist before hitting "Publish":

- [ ] Production build successful (`eas build --platform android --profile production`)
- [ ] App icons + splash screen set
- [ ] Privacy policy URL accessible
- [ ] Terms of service URL accessible
- [ ] Account deletion works
- [ ] Data safety form complete
- [ ] Content rating complete
- [ ] Store listing complete (description, screenshots, feature graphic)
- [ ] Testnet disclaimer visible
- [ ] Deep links configured
- [ ] Tested on 3+ Android devices/emulators
- [ ] No crash on fresh install + onboarding flow
