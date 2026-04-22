# Firefox Auth Bug — Deep Analysis & Resolution Log

> **Status**: Resolved (pending deployment verification)  
> **Affected Browsers**: Firefox (Normal & Dev Edition), Firefox Mobile  
> **Root Cause**: Firefox Enhanced Tracking Protection (ETP) + Total Cookie Protection silently blocking Supabase auth refresh requests  
> **Emergency Rollback Commit**: `10729729bc7b78d4b0e61d9ffbe2d0a4e568fd1b`  

---

## 1. Symptom Description

### Primary Symptoms
- **Login works** on initial page load in normal Firefox
- **After staying on the page for ~50+ minutes**, navigating to new tabs/pages fails to load data
- **Reload fixes the issue** immediately
- **Firefox Dev Edition** cannot log in at all (login loop — returns to login page)
- **Chrome works perfectly** — no issues
- Console shows: `Cross-Origin Request Blocked: ... Status code: (null)` + `TypeError: NetworkError when attempting to fetch resource`

### Secondary Symptoms (Fixed During Diagnosis)
- `onAuthStateChange` never fired `INITIAL_SESSION` in Firefox
- `isLoading` stayed `true` indefinitely in some scenarios
- Constant re-subscription to `onAuthStateChange` suppressed auth events

---

## 2. The Working Baseline (Commit `10729729bc7b78d4b0e61d9ffbe2d0a4e568fd1b`)

### Architecture Overview
The old working code had a simpler auth architecture:

```
AuthProvider.tsx
├── getAccessToken()
│   ├── supabase.auth.getSession() → returns token
│   ├── if expired: supabase.auth.refreshSession() → refresh cross-origin to supabase.co
│   └── fallback: "cookie" sentinel for wallet users
├── Mount effect: getUser() + getSession() + handleGoogleSignIn/handleSession
├── onAuthStateChange: deps = [supabase, isConnected, handleGoogleSignIn]
└── Wallet effect: fetch("/api/user/profile") for wallet auto-login
```

### Why It "Worked" (Most of the Time)
1. **No proactive timeout wrappers** — Supabase calls ran to completion naturally
2. **`getUser()` on mount** — This validated the token server-side and triggered a refresh if needed. Being a single call at mount, it had lower chance of hitting the Firefox block.
3. **Tab stayed active** — If the user kept the tab active, the auto-refresh timer fired successfully (not blocked by tracking protection because the request wasn't classified as "background tracker" while tab was foreground)
4. **Luck** — The refresh often completed before Firefox's tracking protection heuristics kicked in

### Why It Was Actually Broken (Just Less Noticeably)
- The old code **was still vulnerable** to the same Firefox blocking issue
- It just manifested less frequently because:
  - `getUser()` at mount sometimes succeeded
  - Users often reloaded the page before the session expired
  - Chrome users never saw the issue, masking the cross-browser incompatibility

---

## 3. The Failed Fixes (What Didn't Work & Why)

### Attempt 1: Adding `withTimeout()` to Supabase Auth Calls
**Code added**:
```ts
const { data } = await withTimeout(supabase.auth.getSession(), 8000, "getSession");
const { data: refreshed } = await withTimeout(supabase.auth.refreshSession(), 8000, "refreshSession");
```

**Why it failed**:  
Supabase's `@supabase/gotrue-js` uses the **Web Locks API** internally to serialize auth operations. When `withTimeout()` rejected after 8 seconds, the Promise was abandoned but the underlying lock holder continued running. All subsequent `getSession()`/`refreshSession()` calls queued behind the zombie lock and also timed out. This caused a **cascading deadlock** where auth permanently broke until reload.

**Lesson**: Never timeout Promises that hold OS-level locks (Web Locks, IndexedDB transactions, etc.). The timeout rejects the consumer but doesn't release the lock.

---

### Attempt 2: Replacing `getUser()` with `getSession()` on Mount
**Code change**:
```ts
// Old: const { data: { user } } = await supabase.auth.getUser();
// New: const { data: { session } } = await supabase.auth.getSession();
```

**Why it helped but didn't fix the root cause**:  
`getUser()` makes a cross-origin network request to validate the token. `getSession()` reads from cookies locally. Removing `getUser()` reduced cross-origin requests at mount, which helped with initial load. But it didn't address the **auto-refresh timer** that still fired cross-origin requests after ~50 minutes.

---

### Attempt 3: Stabilizing `onAuthStateChange` with Refs
**Code added**:
```ts
const isConnectedRef = useRef(isConnected);
const handleGoogleSignInRef = useRef(handleGoogleSignIn);
// Subscription deps: [supabase] only
```

**Why it helped but wasn't the root cause**:  
This fixed a React effect re-subscription bug where `onAuthStateChange` was recreated constantly, suppressing `INITIAL_SESSION`. This was a **real bug** that caused login issues in some scenarios, but not the "works for 50 minutes then breaks" issue.

---

### Attempt 4: Adding Tab Visibility Recovery with `refreshSession()`
**Code added**:
```ts
// On tab visible after 60s idle:
await supabase.auth.refreshSession();
const probeRes = await fetchWithTimeout("/api/user/profile");
```

**Why it made things worse**:  
If the network was slow, `refreshSession()` held the Supabase auth lock for seconds. If the user navigated to a new page during this time, `getSession()` blocked waiting for the lock. The UI hung until reload.

**Lesson removed**: The final fix removes `refreshSession()` from the visibility handler entirely.

---

### Attempt 5: Adding `credentials: "same-origin"` to Fetch Calls
**Code added**:
```ts
return await fetch(input, { credentials: "same-origin", ...init, signal: controller.signal });
```

**Why it didn't fix the core issue**:  
This ensured cookies were sent with API calls, which was a valid fix for a different bug (wallet auth not sending cookies). But it doesn't affect Supabase's internal `refreshSession()` call, which is made by the Supabase client itself, not our `fetch` wrapper.

---

## 4. The Correct Fix (Current Implementation)

### Core Insight
**Firefox's Enhanced Tracking Protection + Total Cookie Protection categorizes `*.supabase.co` as a tracker domain.** Cross-origin requests to tracker domains are silently blocked when:
- The tab has been idle for a while
- The request fires from a background tab
- Firefox Dev Edition's stricter heuristics trigger

The error signature is diagnostic:
```
Status code: (null)
Reason: CORS request did not succeed
TypeError: NetworkError when attempting to fetch resource
```

A **real** CORS error shows an HTTP status (like 403) or a preflight failure. `(null)` means the browser **never sent the request** — it was killed by tracking protection.

### The Solution: Same-Origin Refresh Proxy

#### File 1: `app/api/auth/refresh/route.ts` (NEW)
A server-side proxy that calls `supabase.auth.refreshSession()` using the server-side Supabase client (`@supabase/ssr`'s `createServerClient`). Server-to-Supabase requests are **never** blocked by browser tracking protection.

```ts
// Browser (same-origin) → /api/auth/refresh → Server → Supabase
//                                    ↑
//                     Firefox allows this (same-origin)
```

#### File 2: `app/utils/supabase/supabaseClient.ts` (MODIFIED)
Disabled `autoRefreshToken: false` in the browser client. This stops the background cross-origin timer that Firefox blocks.

```ts
auth: {
  autoRefreshToken: false, // ← was implicitly true before
},
```

#### File 3: `components/AuthProvider.tsx` (MODIFIED)
Updated `getAccessToken()` to call `/api/auth/refresh` instead of `supabase.auth.refreshSession()`:

```ts
// Old (cross-origin, blocked by Firefox):
const { data: refreshed } = await supabase.auth.refreshSession();

// New (same-origin, bypasses Firefox blocklist):
const res = await fetchWithTimeout("/api/auth/refresh", { method: "POST" });
const refreshed = await res.json();
return refreshed.access_token;
```

### Supporting Fixes (Also Applied)
1. **Removed `refreshSession()` from tab visibility handler** — prevents lock contention
2. **Added 3-second UI safety timeout on mount** — unblocks the page if `getSession()` hangs on a cross-tab lock
3. **Removed `withTimeout()` from Supabase auth calls** — prevents zombie lock holders
4. **Stabilized `onAuthStateChange` subscription** — `[supabase]` deps only, callbacks via refs

---

## 5. Comparison: Old vs. Current Architecture

| Aspect | Old (`10729729`) | Current (Fixed) |
|--------|------------------|-----------------|
| **Mount hydration** | `getUser()` + `getSession()` | `getSession()` + `/api/user/profile` probe |
| **Token refresh** | `supabase.auth.refreshSession()` (cross-origin) | `/api/auth/refresh` (same-origin proxy) |
| **Auto-refresh timer** | Enabled (implicit `autoRefreshToken: true`) | Disabled (`autoRefreshToken: false`) |
| **onAuthStateChange deps** | `[supabase, isConnected, handleGoogleSignIn]` | `[supabase]` only (refs for callbacks) |
| **Tab visibility handler** | None | Re-probes profile (no `refreshSession()`) |
| **Safety timeout** | None | 3s UI unblock + 10s auth fallback |
| **Firefox ETP resilience** | Vulnerable (masked by luck) | Explicitly bypassed via same-origin proxy |

---

## 6. Why Sleep Mode Is a Red Herring

The user noted that network errors could be from the computer going to sleep. Here's why the sleep hypothesis doesn't match the evidence:

| Sleep Mode | Firefox ETP Block |
|------------|-------------------|
| Affects **all** network requests indiscriminately | Only affects **cross-origin requests to tracker domains** |
| Error would show `ERR_NETWORK_CHANGED` or `NS_ERROR_NET_TIMEOUT` | Error shows `Status code: (null)` + `CORS request did not succeed` |
| Recovery is automatic when network returns | Requires reload to reset Supabase client state |
| Would affect Chrome too | Only affects Firefox |
| Timing is random (whenever sleep occurs) | Timing is consistent (~50 min = token expiry) |

**Conclusion**: Sleep might cause occasional network errors, but the consistent "after some minutes" pattern with `(null)` status is definitively Firefox tracking protection.

---

## 7. Testing Checklist for Deployment Verification

### Normal Firefox
- [ ] Log in with Google
- [ ] Stay on page for 60+ minutes (or manually expire session cookie)
- [ ] Navigate to new pages/tabs — data should load
- [ ] No `Status code: (null)` errors in console

### Firefox Dev Edition
- [ ] Log in with Google
- [ ] Should not loop back to login page
- [ ] Session should persist across page reloads

### Regression Tests
- [ ] Chrome still works (no changes to Chrome behavior)
- [ ] Wallet login still works
- [ ] Google + wallet linking still works
- [ ] Logout works for both auth methods
- [ ] Session refresh happens transparently during API calls

---

## 8. Lessons for Future AI Agents

1. **Never wrap lock-holding Promises with `Promise.race`/timeout** — creates zombie lock holders
2. **Status `(null)` + `NetworkError` in Firefox = tracking protection, not CORS** — look for the `(null)` status
3. **Cross-origin auth refresh is fragile in Firefox** — always prefer same-origin proxies for auth operations
4. **Disable `autoRefreshToken` when using cookie-based auth with Supabase SSR** — proactive refresh in `getAccessToken()` is more reliable
5. **Firefox != Chrome** — always test auth flows in both; Chrome's permissive defaults hide privacy-related bugs
6. **The old code wasn't truly "working"** — it was just lucky. Don't assume the baseline is bug-free.

---

## 9. Files Changed in This Fix

| File | Change |
|------|--------|
| `app/api/auth/refresh/route.ts` | **NEW** — Same-origin refresh proxy |
| `app/utils/supabase/supabaseClient.ts` | Added `autoRefreshToken: false` + `cookieOptions` |
| `components/AuthProvider.tsx` | Proxy refresh in `getAccessToken()`, stabilized subscription, removed `withTimeout` from auth calls, added UI safety timeouts, removed `refreshSession()` from visibility handler |
| `app/social/SocialPageClient.tsx` | Skip `Authorization` header when `token === "cookie"` |

---

## 10. If This Fix Still Doesn't Work

### Next Diagnostic Steps
1. Check if Firefox Dev Edition console shows **different** errors (not the `(null)` refresh error)
2. Look for `Partitioned` cookie attribute issues in Dev Edition
3. Consider adding `__Host-` prefix to cookies for stricter same-site enforcement
4. As nuclear option: store session in `localStorage` instead of cookies (less secure but bypasses cookie partitioning)
5. The emergency rollback commit `10729729bc7b78d4b0e61d9ffbe2d0a4e568fd1b` is always available via:
   ```bash
   git checkout 10729729bc7b78d4b0e61d9ffbe2d0a4e568fd1b -- components/AuthProvider.tsx
   ```
