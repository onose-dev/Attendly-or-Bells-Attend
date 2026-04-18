# BAP Student Dashboard — Development Roadmap
> Ordered task list from blank file to fully shipped student-side platform

---

## How to Use This Roadmap

Tasks are grouped into **7 phases** that build on each other. Each task is atomic — it has one clear output and can be checked off independently. Complete Phase 1 entirely before moving to Phase 2. Within a phase, tasks can be parallelised where marked **[parallel ok]**.

**Legend:**
- 🏗️ Structure / HTML
- 🎨 Styling / CSS
- ⚙️ Logic / JavaScript
- 🔗 Supabase Integration
- 🧪 Testing / QA

---

## Phase 1 — Static Shell & Design System
> Goal: Every screen exists as a styled HTML file. No JS logic. Design tokens locked.

- [ ] 🎨 Create `variables.css` — define all design tokens: color palette, font sizes, spacing scale, border radius, shadow levels, z-index ladder, transition speeds
- [ ] 🎨 Create `reset.css` — normalize browser defaults, set `box-sizing: border-box`, remove default margins
- [ ] 🏗️ Build `index.html` — role selection landing page with three role cards: Student, Lecturer, (Admin hidden)
- [ ] 🎨 Style the landing page — mobile-first, full-viewport, centered layout, role cards with hover states
- [ ] 🏗️ Build `onboarding/path-a.html` — two-field form: Full Name + Matric Number, submit button, "no match" error state, link to Path B
- [ ] 🏗️ Build `onboarding/path-b.html` — full registration form: Full Name, Matric No, College, Department, Programme dropdown, Level dropdown; inline error state for Matric field
- [ ] 🏗️ Build `onboarding/course-review.html` — checklist of course cards, "Search & Add" bar with result cards, "Confirm Courses" CTA
- [ ] 🏗️ Build `onboarding/permissions.html` — permission prompt screen with GPS and Notification request buttons, "Why we need this" tooltip, denied-warning state
- [ ] 🏗️ Build `dashboard/index.html` — four-zone layout: Zone 1 (alert banner, hidden by default), Zone 2 (course card list), Zone 3 (sticky bottom bar), Zone 4 (profile tab accessible via top nav)
- [ ] 🎨 Build `components.css` — style all reusable components: course cards, progress rings, banners, modals, toasts, buttons, badges, input fields, error states
- [ ] 🎨 Build `dashboard.css` — dashboard-specific layout, sticky top nav, sticky bottom bar, scrollable Zone 2
- [ ] 🎨 Build `onboarding.css` — onboarding screen layouts, form styles, step indicators
- [ ] 🏗️ Build the Active Session Alert banner (Zone 1) as a static HTML component — amber background, course name, room name, countdown placeholder, "Check In Now →" button
- [ ] 🏗️ Build the Course Card component — course code, course title, circular progress ring (static SVG placeholder), last session date/status line, expand chevron
- [ ] 🏗️ Build the expanded card session log — collapsible section inside each card; timeline list of sessions with date + status icon (✓ ✗ ⚠ ~)
- [ ] 🏗️ Build the Quick Actions Bar (Zone 3) — "Add Course" button + Notification Bell icon with badge
- [ ] 🏗️ Build the Profile Tab panel — read-only fields layout, masked Device ID display, "Request Change" link
- [ ] 🏗️ Build the Check-in Modal — distraction-free overlay; course name, room, countdown timer placeholder, 6-digit code input, disabled "Check In" button with tooltip, gate status area
- [ ] 🏗️ Build the Check-in Success screen — confirmation layout inside modal: "You're in! ✓", course name, timestamp
- [ ] 🏗️ Build the Check-in Failure screen — error layout inside modal with message area, conditional "Try Again" / "Contact your lecturer" button
- [ ] 🏗️ Build the Add Course modal — search input, results list (Code | Title | Dept | Level | Add button), empty state, loading state
- [ ] 🏗️ Build the Notification History panel — slide-in or dropdown; notification item list (read/unread states); empty state
- [ ] 🏗️ Build the Offline banner — full-width top banner: "Offline — Waiting for Sync", replaces Zone 1

**Phase 1 Exit Criteria:** Every screen and component can be viewed in a browser as a static file. All states exist as HTML (visible simultaneously for review). No blank states. Design system variables used throughout — no hardcoded colors or sizes.

---

## Phase 2 — Supabase Setup & Authentication
> Goal: Students can register, log in, and have their profile fetched. Supabase client is wired.

- [ ] 🔗 Create `js/supabase.js` — initialise the Supabase client with project URL and anon key; export a single `supabase` instance used by all other modules
- [ ] 🔗 Create `js/auth.js` — implement: `registerStudent(data)`, `loginStudent(email, password)`, `logoutStudent()`, `getCurrentUser()`, `getStudentProfile(userId)`
- [ ] ⚙️ Wire Path A form submission — on submit, call Supabase to match Full Name + Matric No; on match route to course review; on no match show error; validate Matric regex client-side before submit
- [ ] ⚙️ Wire Path B form submission — on submit, call Supabase to check duplicate matric; on clear, create `auth.signUp()` + insert `profiles` row; route to course review
- [ ] ⚙️ Implement real-time Matric Number regex validation (Path B) — validate on `blur` event; show inline error immediately; clear error on valid input
- [ ] 🔗 Fetch and render course checklist on `course-review.html` — query `courses` table filtered by student's `level` and `department`; render as checkboxes
- [ ] ⚙️ Wire "Confirm Courses" — write checked courses to `student_courses` table; require at least one selection (show error if none); route to permissions screen
- [ ] ⚙️ Wire "Search & Add" course bar — on input (debounced 300ms), query `courses` table by code/title; render results; "Add" button inserts to `student_courses` and adds card to the checklist visually
- [ ] 🔗 Implement session persistence — on app load, call `supabase.auth.getSession()`; if session exists skip login; if not, redirect to onboarding/login
- [ ] 🔗 Implement logout — clear session, clear localStorage cache, redirect to landing

**Phase 2 Exit Criteria:** A new student can complete Path A or Path B onboarding end-to-end in the browser. Their `profiles` and `student_courses` records appear in the Supabase dashboard. Session persists on page refresh.

---

## Phase 3 — Dashboard Core: Cache, Courses & State Machine
> Goal: Dashboard loads instantly from cache, renders course cards, and manages UI state.

- [ ] ⚙️ Create `js/cache.js` — implement: `setCache(userId, key, data)`, `getCache(userId, key)`, `clearCache(userId)`; all keys prefixed with `userId` to prevent cross-profile leakage
- [ ] ⚙️ Implement dashboard load sequence in `js/dashboard.js`:
  1. Read `profile` and `courses` from localStorage → render immediately (zero-wait first paint)
  2. Fetch fresh data from Supabase async in background
  3. On fetch success: update UI + overwrite localStorage cache
- [ ] ⚙️ Implement the 5-state dashboard state machine in `js/dashboard.js` — states: `DEFAULT`, `ACTIVE_SESSION`, `CHECKED_IN`, `OFFLINE`, `POST_CHECKIN` (success/fail sub-states); each state triggers the correct DOM changes
- [ ] ⚙️ Render course cards dynamically — for each enrolled course, create a card DOM element with: code, title, attendance %, last session date/status; append to Zone 2
- [ ] ⚙️ Implement circular progress ring rendering — calculate `stroke-dashoffset` from attendance % (sessions attended ÷ total sessions × 100); apply color: green ≥75%, amber 50–74%, red <50%
- [ ] ⚙️ Implement expand/collapse for course cards — clicking the chevron toggles the session log timeline; animate with CSS `max-height` transition; fetch session log from `attendance_logs` on first expand
- [ ] ⚙️ Implement the Offline state — listen for `window` `offline` event → transition state machine to `OFFLINE`; render sync banner; disable check-in; show cached course cards. Listen for `online` event → resume normal state
- [ ] ⚙️ Implement `js/ui.js` — DOM helpers: `showModal(id)`, `hideModal(id)`, `showToast(message, duration)`, `updateBanner(state)`, `updateBadgeCount(n)`; used by all other modules

**Phase 3 Exit Criteria:** Dashboard opens and renders enrolled courses instantly from cache. Courses show correct attendance percentages with color-coded progress rings. Expanded cards show session history. Toggling network off shows offline banner.

---

## Phase 4 — Device Binding & Geolocation
> Goal: Device is fingerprinted on first login. GPS is captured and validated for check-in.

- [ ] ⚙️ Create `js/fingerprint.js` — load FingerprintJS; implement `getDeviceId()` → returns the visitor ID; implement `bindDevice(userId)` → get fingerprint + write `device_id` to `profiles` row + show "Device registered" confirmation; implement `verifyDevice(userId)` → compare live fingerprint to stored `device_id`, return boolean
- [ ] ⚙️ Call `bindDevice()` on first successful login — detect first login by checking if `profiles.device_id` is null; run binding only once; show subtle confirmation message
- [ ] ⚙️ Create `js/geolocation.js` — implement `requestLocation()` → wraps `navigator.geolocation.getCurrentPosition()` with a 10-second timeout; returns a Promise resolving to `{lat, lng}` or rejecting with `LOCATION_DENIED` / `LOCATION_TIMEOUT`; implement `haversineDistance(coord1, coord2)` → returns distance in metres
- [ ] ⚙️ Implement geolocation-gated button in the check-in modal:
    - Button starts disabled, tooltip: "Waiting for your location…"
    - Call `requestLocation()` immediately when modal opens
    - On success: enable button, remove tooltip
    - On timeout: keep disabled, show "Retry Location" link that re-calls without closing modal
    - On denied: keep disabled, show LOCATION_DENIED error guidance
- [ ] ⚙️ Implement GPS denied guidance — detect browser type (Chrome Android / Safari iOS / Chrome desktop); show step-by-step instructions for enabling location in that specific browser; link opens instructions inline (not a new page)

**Phase 4 Exit Criteria:** On first login, device fingerprint is stored in Supabase. Opening the check-in modal triggers GPS request. Button is disabled until coordinates are returned. Denying location shows correct browser-specific instructions. Haversine formula returns correct distance for known coordinate pairs (unit tested manually).

---

## Phase 5 — Check-in Gate Flow
> Goal: Full 3-gate check-in works end-to-end. All outcomes logged to Supabase.

- [ ] ⚙️ Create `js/checkin.js` — the main check-in orchestrator; implements `runCheckin(code)` which runs the full gate sequence and returns a typed result
- [ ] ⚙️ Implement Gate 1 — Room Code validation: query `attendance_sessions` where `room_code = code AND status = 'Active' AND expiry_timestamp > now()`; return `CODE_INVALID` or `CODE_EXPIRED` on fail; return `sessionId` + `roomId` on pass
- [ ] ⚙️ Implement Gates 2 + 3 in parallel — call `Promise.all([geofenceCheck(roomId), deviceCheck(userId)])`; both must resolve to Pass before proceeding; collect both fail reasons if multiple fail
- [ ] ⚙️ Implement Gate 2 — Geofence check: fetch room coords from `rooms` table using `roomId`; call `haversineDistance()`; classify result: Pass / SoftPass / Fail; return result + distance
- [ ] ⚙️ Implement Gate 3 — Device check: call `verifyDevice(userId)`; return Pass or Fail with `DEVICE_MISMATCH`
- [ ] ⚙️ Implement Course Registration check — verify `student_courses` has entry for `session.course_id`; return `COURSE_NOT_REGISTERED` if missing
- [ ] 🔗 Implement outcome logging — on all gates pass: insert `attendance_logs` row `{status: 'Present', flagged: false}`; on any fail: insert row `{status: 'Failed', flagged: true, reason_code: '...'}` — always write, never skip
- [ ] ⚙️ Wire check-in modal UI to `runCheckin()` — on code submit: disable button, show loading state, run gates, render success or failure screen; on success: auto-return to dashboard after 4 seconds; update course card attendance % in real time
- [ ] ⚙️ Implement "Try Again" button logic — shown only if session `expiry_timestamp` is still in the future; hidden/replaced with "Contact your lecturer" if session has expired
- [ ] ⚙️ Implement the "already checked in" banner state — on dashboard load and on Realtime session insert, check `attendance_logs` for a `Present` record matching the current session; if found, render banner as green "Attendance Recorded ✓" instead of amber check-in prompt

**Phase 5 Exit Criteria:** Full check-in flow works in a real browser. Correct records appear in `attendance_logs` for every attempt. Success screen shows and dashboard updates. Each failure mode shows the correct human-readable error message. Attempting to check in again after success shows "Attendance Recorded ✓" banner.

---

## Phase 6 — Realtime, Notifications & Countdown
> Goal: Session alert banner appears live. Countdown syncs. Push notifications work.

- [ ] ⚙️ Create `js/realtime.js` — open Supabase Realtime channel `sessions-channel`; filter for `course_id IN (student's enrolled course IDs)`; on `INSERT` with `status = 'Active'`: call `dashboard.js` to transition to `ACTIVE_SESSION` state; on `UPDATE` of `expiry_timestamp`: update countdown timer
- [ ] ⚙️ Open second Realtime channel `attendance-channel` — filter for `student_id = currentUser.id`; on `INSERT` with `status = 'Present'`: re-fetch course attendance data and update the relevant course card's progress ring
- [ ] ⚙️ Implement live countdown timer — calculate `remainingMs = expiry_timestamp - Date.now()`; use `setInterval(1000)` to tick; apply color classes: neutral → amber at 2 min → red at 1 min → flashing red at 30s; on `expiry_timestamp` update from Realtime: clear old interval, recalculate, restart
- [ ] ⚙️ Implement session extension toast — on Realtime `expiry_timestamp` UPDATE: show toast "Attendance window extended by X minutes" (auto-dismiss 5s); also update countdown timer
- [ ] ⚙️ Create `sw.js` — register service worker; handle `push` event (show notification with course name, room, time remaining); handle `notificationclick` event (open app + route to check-in modal for that course)
- [ ] ⚙️ Register service worker on dashboard load — call `navigator.serviceWorker.register('/sw.js')`; request notification permission if not already granted (or denied); subscribe to push with VAPID public key; send `push_subscription` object to Supabase to store against student profile
- [ ] ⚙️ Create `js/notifications.js` — implement: `fetchNotificationHistory(userId)` (query `notifications` table); `markAllRead(userId)` (update `read = true`); `getUnreadCount(userId)` (return count); `renderNotificationPanel(notifications)` (build DOM list)
- [ ] ⚙️ Wire notification bell — on bell click: open panel, call `fetchNotificationHistory()`, render list, call `markAllRead()`, reset badge to 0
- [ ] ⚙️ Implement in-app session ping — when Realtime fires an active session event and the app is open: show overlay toast "📍 [Course] attendance is now open — [Room]. You have X minutes." + update badge count

**Phase 6 Exit Criteria:** Starting a session in Supabase (simulating a lecturer action) causes the student dashboard to show the alert banner live without refresh. Countdown ticks correctly. Changing `expiry_timestamp` in Supabase updates the student's timer in real time. Service worker is registered. Push notification appears when app is in background.

---

## Phase 7 — Polish, Accessibility & QA
> Goal: The product is production-ready. All edge cases handled. Accessible. Cross-browser tested.

- [ ] 🧪 Manually walk all 5 dashboard states — verify clean transitions: DEFAULT → ACTIVE_SESSION → CHECKED_IN; DEFAULT → OFFLINE → DEFAULT; POST_CHECKIN_SUCCESS → CHECKED_IN; POST_CHECKIN_FAIL with each reason code
- [ ] 🎨 Apply WCAG AA color contrast audit — test all foreground/background pairs: progress ring colors (green/amber/red on card bg), banner text on amber/green, error messages, disabled button state
- [ ] 🏗️ Add `aria-label` to all icon buttons — bell icon, expand chevron, close buttons, modal overlay
- [ ] 🏗️ Add `aria-live="polite"` region to Active Session Alert banner — screen readers announce session start without focus change
- [ ] 🏗️ Implement modal focus trap — when check-in modal opens, focus moves to first input; Tab cycles only within modal; Escape closes modal
- [ ] 🏗️ Link all error messages to inputs via `aria-describedby` — Matric Number field error, check-in code input error
- [ ] ⚙️ Handle network outage mid-check-in — wrap `runCheckin()` fetch calls in try/catch; on network error: show "Connection lost — please try again"; do not write any partial record; preserve modal state for retry
- [ ] ⚙️ Implement geolocation timeout retry — 10-second timeout on `getCurrentPosition()`; on timeout show "Retry Location" link; clicking re-calls without closing modal or reloading
- [ ] ⚙️ Handle "Room Not Geocoded" — before running Gate 2, check if `rooms` row has valid lat/lng; if null, show error: "Room coordinates not configured. Contact your admin." Block check-in gracefully
- [ ] ⚙️ Enforce "One code per day" UI rule — on dashboard load, check `attendance_sessions` for a closed session for each enrolled course today; if found, mark that course card with "Session completed today" and disable check-in initiation for it
- [ ] 🧪 Cross-browser QA — test on: Chrome Android, Safari iOS, Chrome Desktop, Firefox Desktop; verify geolocation, push notifications, localStorage, Realtime, service worker all function correctly
- [ ] 🧪 Test carry-over student scenario — register a student with a course from a different level; verify they receive the session alert, can check in, and the attendance logs correctly
- [ ] 🧪 Test offline → online transition — disconnect network, verify offline banner and cached cards; reconnect, verify banner removes and Realtime re-subscribes
- [ ] 🎨 Final visual QA pass — check spacing, typography, alignment across all screens at 375px, 768px, and 1280px; fix any layout issues
- [ ] ⚙️ Confirm localStorage key namespacing — verify no data leaks between two different student accounts on the same device/browser; clear cache on logout

**Phase 7 Exit Criteria:** All 5 states transition correctly. WCAG AA passes on all components. Modal focus trap works. Cross-browser QA signed off. Carry-over scenario works end-to-end. The product ships.

---

## Quick Reference — File-to-Feature Map

| File | Feature |
|---|---|
| `js/supabase.js` | Supabase client init |
| `js/auth.js` | Login, register, session, profile fetch |
| `js/fingerprint.js` | Device bind + device verify |
| `js/geolocation.js` | GPS capture + Haversine |
| `js/checkin.js` | 3-gate check-in orchestrator |
| `js/courses.js` | Course fetch, render, add, cache |
| `js/realtime.js` | Supabase Realtime subscriptions |
| `js/notifications.js` | Bell, history, push subscription |
| `js/cache.js` | localStorage read/write |
| `js/dashboard.js` | State machine + load sequence |
| `js/ui.js` | DOM helpers, toast, modal, banner |
| `sw.js` | Service worker (push + offline) |