# BAP Student Dashboard — BUILD.md
> BELLS Attendance Platform · Student Interface · HTML / CSS / Vanilla JS + Supabase

---

## Project Overview

The Student Dashboard is the primary interface for students on the BELLS Attendance Platform. It handles onboarding, course management, real-time session check-in via a 3-gate validation flow (room code → geofence → device fingerprint), attendance tracking, and notifications. It is a **web-only, mobile-first** application with no framework dependency — built in plain HTML, CSS, and JavaScript against a Supabase backend.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | HTML5 · CSS3 · Vanilla JS (ES Modules) |
| Backend / DB | Supabase (Postgres + Auth + Realtime + RLS) |
| Device ID | FingerprintJS (Pro or OSS) |
| Geolocation | `navigator.geolocation` Web API |
| Geo Math | Haversine formula (client-side JS) |
| Push Notifications | Web Push API + Service Worker + VAPID keys |
| Offline Caching | `localStorage` (user-scoped keys) |
| Realtime | Supabase Realtime channels |

---

## Folder Structure

```
/bap-student/
├── index.html                  # Role selection landing page
├── onboarding/
│   ├── path-a.html             # School DB sync onboarding
│   ├── path-b.html             # Manual registration form
│   ├── course-review.html      # Course selection screen
│   └── permissions.html        # GPS + notification permission prompt
├── dashboard/
│   └── index.html              # Main student dashboard
├── css/
│   ├── reset.css
│   ├── variables.css           # Design tokens (colors, spacing, type)
│   ├── components.css          # Cards, modals, banners, buttons
│   ├── dashboard.css           # Dashboard-specific layout
│   └── onboarding.css          # Onboarding screens
├── js/
│   ├── supabase.js             # Supabase client init + helpers
│   ├── auth.js                 # Login, registration, session
│   ├── fingerprint.js          # FingerprintJS device binding
│   ├── geolocation.js          # GPS capture + Haversine formula
│   ├── checkin.js              # 3-gate check-in flow
│   ├── courses.js              # Course fetch, cache, add, render
│   ├── notifications.js        # In-app bell + push notification logic
│   ├── realtime.js             # Supabase Realtime subscriptions
│   ├── cache.js                # localStorage read/write helpers
│   ├── dashboard.js            # Dashboard state machine
│   └── ui.js                   # DOM helpers, toast, modal, state render
├── sw.js                       # Service worker (push + offline)
└── assets/
    └── icons/                  # SVG icons
```

---

## Database Tables (Supabase)

The student dashboard reads/writes the following tables. Schema ownership belongs to the backend developer — this document captures what the student frontend depends on.

| Table | Student Access | Purpose |
|---|---|---|
| `profiles` | Read own row | Full Name, Matric, Level, Dept, Programme, device_id, reg_path |
| `courses` | Read all | Course catalogue for search + auto-suggest |
| `student_courses` | Read/Write own rows | Enrolled courses junction table |
| `attendance_sessions` | Read (via Realtime) | Active sessions for enrolled courses |
| `attendance_logs` | Read/Write own rows | Check-in attempt records |
| `rooms` | Read | Room name, lat, lng, radius_meters |
| `notifications` | Read own rows | Notification history |

---

## Supabase Realtime Subscriptions

The dashboard opens **two** persistent Realtime channels on load:

1. **`sessions-channel`** — subscribes to `attendance_sessions` filtered by `course_id IN (student's enrolled course IDs)`. Triggers the Active Session Alert banner when `status = 'Active'` is inserted. Updates the countdown timer when `expiry_timestamp` changes.

2. **`attendance-channel`** — subscribes to `attendance_logs` filtered by `student_id`. Used to update the course card attendance percentage in real time after a successful check-in.

---

## localStorage Cache Schema

All keys are prefixed with the student's Supabase `user.id` to prevent cross-profile leakage on shared devices.

```
{user_id}:profile        → JSON object of the student's profile row
{user_id}:courses        → JSON array of enrolled course objects
{user_id}:notifications  → JSON array of recent notifications (last 50)
```

Cache is **written on every successful Supabase fetch** and **read first on every dashboard load** for instant render before async data arrives.

---

## Check-in Gate Logic

All three gates run on the client. Gates 2 and 3 run in **parallel** via `Promise.all`. All three must pass before writing a success record.

```
Gate 1 — Room Code
  → POST code to Supabase: match against sessions where status='Active' AND now() < expiry_timestamp
  → Fail: CODE_INVALID or CODE_EXPIRED

Gate 2 — Geofence (runs in parallel with Gate 3)
  → navigator.geolocation.getCurrentPosition()
  → Haversine(student_coords, room_coords)
  → ≤30m  → Pass
  → 31–50m → Soft Pass (log, mark for review, do NOT show as Flagged to lecturer)
  → >50m  → Fail: GEOFENCE_FAIL

Gate 3 — Device Integrity (runs in parallel with Gate 2)
  → FingerprintJS.get() → compare to profiles.device_id
  → Match  → Pass
  → Mismatch → Fail: DEVICE_MISMATCH (log proxy attempt, alert lecturer feed)

All Pass → Write attendance_logs row: { status: 'Present', flagged: false }
Any Fail → Write attendance_logs row: { status: 'Failed', flagged: true, reason_code: '...' }
```

---

## Dashboard State Machine

The dashboard has five mutually exclusive render states. `dashboard.js` manages transitions.

| State | Trigger | UI Change |
|---|---|---|
| `DEFAULT` | No active session for enrolled courses | Banner hidden. Course cards visible. Check-in CTAs dormant. |
| `ACTIVE_SESSION` | Realtime: session inserted with matching course_id | Alert banner appears (amber). Countdown starts. "Check In Now →" active. |
| `CHECKED_IN` | Student already has a Present log for current session | Banner turns green: "Attendance Recorded ✓". Check-in button removed. |
| `OFFLINE` | `window` fires `offline` event | Sync banner replaces Zone 1. Cards render from cache. Check-in disabled. |
| `POST_CHECKIN_SUCCESS` | Gate validation passes | Confirmation screen (3–5s), then auto-return to CHECKED_IN state. |
| `POST_CHECKIN_FAIL` | Any gate fails | Error screen with human-readable message + conditional "Try Again" button. |

---

## Error Messages (Student-Facing)

Never show raw error codes. Map `reason_code` → human message:

| Code | Message |
|---|---|
| `GEOFENCE_FAIL` | "You appear to be outside the lecture hall. Move closer to the front of the room and try again. Make sure your location services are turned on." |
| `DEVICE_MISMATCH` | "This device doesn't match your registered device. If you believe this is an error, please contact your administrator." |
| `CODE_EXPIRED` | "The attendance window has closed. If you were present in the hall, speak to your lecturer or administrator." |
| `CODE_INVALID` | "That code doesn't match any active session. Double-check the code on the board and try again." |
| `COURSE_NOT_REGISTERED` | "You're not registered for this course. Go to your dashboard and add it under 'Add Course', then contact your administrator." |
| `LOCATION_DENIED` | "Location access is required to verify you're in the hall. Tap here for instructions on enabling location in your browser." |

---

## Geolocation-Gated Button Contract

The "Check In" submit button inside the check-in modal must follow this contract strictly:

- **Disabled on modal open** — gray, cursor: not-allowed, tooltip: "Waiting for your location…"
- **Enabled** when `navigator.geolocation.getCurrentPosition()` returns a successful position
- **Stays disabled with error tooltip** if geolocation is denied or times out after 10 seconds
- **Retry** on timeout: show a "Retry Location" link that re-calls `getCurrentPosition()` without closing the modal or reloading the page
- The button state updates reactively — no manual refresh needed

---

## Notifications Architecture

### In-App
- Notification bell in the top nav with an unread badge count
- On click: opens a slide-in panel listing all notifications (session pings, extension toasts, flagged warnings)
- When app is open and a session starts: show an overlay toast + update the bell badge

### Browser Push
- Requires service worker registration (`sw.js`)
- Requires VAPID public key from backend developer
- On session start: backend triggers push to all students in `student_courses` for that `course_id`
- Tapping a push notification opens the app and launches the check-in modal directly for that course
- Session extension: push a toast — "Attendance window extended by X minutes"

### Permission Grant Screen
Shown once after onboarding. Two buttons:
- "Allow Location" → triggers `navigator.geolocation.getCurrentPosition()`
- "Allow Notifications" → triggers `Notification.requestPermission()`

If denied, show inline warning — do not block progression, but warn that check-in and alerts will not work.

---

## Onboarding Flows

### Path A — School DB Sync
1. Enter Full Name + Matric Number
2. System queries Supabase for matching school record
3. On match: profile auto-populated → go to Course Review
4. On no match: error + link to Path B

### Path B — Manual Registration
1. Fill full form: Full Name, Matric No (regex validated inline on blur), College, Department, Programme, Level
2. Submit → check for duplicate matric in `profiles`
3. On success → go to Course Review

### Course Review (both paths)
1. Auto-populate checklist from `courses` table filtered by student's Level + Department
2. Student checks/unchecks active courses
3. "Search & Add" bar for carry-overs/electives — full course search, click "Add" to include
4. At least one course required to proceed
5. Writes entries to `student_courses`

### Device Binding
- Runs once on first successful login/registration
- `FingerprintJS.get()` → write `device_id` to `profiles`
- Show: "Your device has been registered for secure attendance"

### Permission Grant
- GPS + Push Notification permission screen
- Plain-language copy with "Why we need this" tooltips

---

## Performance Requirements

- Dashboard must render from localStorage cache **before** Supabase fetch completes (instant first paint)
- Supabase fetch runs async in background — updates the UI when complete
- Check-in validation response: ≤3 seconds at p99
- Geolocation timeout: 10 seconds, then show retry — never hang indefinitely
- Realtime countdown sync: update immediately on `expiry_timestamp` change, no polling

---

## Accessibility

- WCAG AA color contrast minimum across all states
- `aria-label` on all icon buttons (bell, chevron, close)
- Modal focus trap when check-in modal is open
- `aria-live` region for the Active Session Alert banner (screen readers announce session start)
- Error messages linked to inputs via `aria-describedby`

---

## Security Notes for Frontend

- **Never** expose the full `device_id` in the UI — mask it (e.g., "Device: ••••A3F2")
- **Never** allow students to edit core profile fields from the UI — "Request Change" link routes to admin contact
- All Supabase queries run under the authenticated user's JWT — RLS enforces row-level access
- localStorage keys are prefixed with `user.id` to prevent cross-profile data leakage on shared devices
- Gate 2 + Gate 3 results are evaluated server-side before writing the final log record — client passes coordinates and fingerprint, not the pass/fail result

---

## Milestones (Student Frontend Only)

| Week | Deliverable |
|---|---|
| Week 1 | Static HTML/CSS shell: all screens built, no JS logic. Design system established (variables.css). |
| Week 2 | Onboarding flow live: Path A + B forms, course selection, device binding, permission screen. |
| Week 3 | Dashboard live: localStorage cache, Realtime subscription, course cards, state machine wired. |
| Week 4 | Check-in module complete: all 3 gates, geolocation-gated button, success/fail screens. |
| Week 5 | Notifications complete: in-app bell, push registration, service worker, extension toasts. |
| Week 6 | Offline state, error messaging polish, WCAG audit, cross-browser QA. |

---

## Key Decisions & Constraints

- **No frontend framework** — plain ES Modules only. No React, Vue, or build toolchain required.
- **Mobile-first** — all CSS written for ~375px viewport first, then `min-width` breakpoints for tablet/desktop.
- **One code per day** — the UI must enforce this: if a session already ran today for a course, the check-in button is replaced with "Session already completed today."
- **Carry-over students** — the course search and add flow must work for any course across any level. The notification and check-in systems treat carry-over students identically to registered students.
- **No partial check-in records** — if the network drops mid-submission, no record is written. The student retries when connectivity is restored.