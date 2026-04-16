Lecturer-App Build Documentation

University Attendance Management PWA - Lecturer Application

Table of Contents

- Project Structure

- HTML Pages

- Login Page

- Initials Setup Page

- Dashboard

- Session Creation

- Live Session View

- Pending Approvals

- Manual Attendance

- Attendance Records

- CSS Styling

- JavaScript Modules

- Real-time Features

- Security Considerations

Project Structure

lecturer-app/
├── index.html              # Login page
├── setup-initials.html     # First-time initials setup
├── dashboard.html          # Main dashboard
├── create-session.html     # Create new attendance session
├── live-session.html       # Real-time session monitoring
├── pending-approvals.html  # Device mismatch approvals
├── manual-attendance.html  # Manual student addition
├── attendance-records.html # View/export attendance
├── no-class.html          # Create "No Class" sessions
├── css/
│   ├── main.css           # Global styles
│   └── components.css     # UI components
├── js/
│   ├── app.js             # Main application logic
│   ├── supabase-client.js # Supabase integration
│   ├── session-manager.js # Session management
│   ├── realtime.js        # Real-time subscriptions
│   ├── qr-generator.js    # QR code generation
│   └── export.js          # Data export utilities
├── manifest.json          # PWA manifest
└── sw.js                  # Service worker

HTML Pages

Login Page (index.html)

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#1a365d">
    <title>Attendly - Lecturer Login</title>
    <link rel="manifest" href="manifest.json">
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body class="login-page">
    <div class="login-container">
        <div class="login-header">
            <img src="assets/logo.svg" alt="Attendly Logo" class="logo">
            <h1>Attendly</h1>
            <p class="subtitle">Lecturer Portal</p>
        </div>

        <form id="loginForm" class="login-form">
            <div class="form-group">
                <label for="staffId">Staff ID</label>
                <input type="text" id="staffId" name="staffId"
                       placeholder="Enter your Staff ID"
                       autocomplete="username" required>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <div class="password-input-wrapper">
                    <input type="password" id="password" name="password"
                           placeholder="Enter your password"
                           autocomplete="current-password" required>
                    <button type="button" class="toggle-password" aria-label="Toggle password visibility">
                        <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label for="initials">Your Initials</label>
                <input type="text" id="initials" name="initials"
                       placeholder="e.g., JD"
                       maxlength="3"
                       pattern="[A-Za-z]{1,3}"
                       title="Enter 1-3 letters only"
                       required>
                <small class="helper-text">Your initials will be stamped on attendance codes</small>
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="loginBtn">
                <span class="btn-text">Sign In</span>
                <span class="btn-loader hidden">
                    <svg class="spinner" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor"
                                stroke-width="3" fill="none" stroke-dasharray="60">
                        </circle>
                    </svg>
                </span>
            </button>

            <div id="loginError" class="error-message hidden"></div>
        </form>

        <div class="login-footer">
            <p>Having trouble logging in? Contact IT Support</p>
        </div>
    </div>

    <script src="js/supabase-client.js"></script>
    <script src="js/app.js"></script>
    <script>
        // Login page initialization
        document.addEventListener('DOMContentLoaded', async () => {
            // Check if already logged in
            const user = await LecturerAuth.getCurrentLecturer();
            if (user) {
                window.location.href = 'dashboard.html';
                return;
            }

            // Setup form handler
            const loginForm = document.getElementById('loginForm');
            const loginBtn = document.getElementById('loginBtn');
            const loginError = document.getElementById('loginError');

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const staffId = document.getElementById('staffId').value.trim();
                const password = document.getElementById('password').value;
                const initials = document.getElementById('initials').value.trim().toUpperCase();

                // Validate initials format
                if (!/^[A-Z]{1,3}$/.test(initials)) {
                    showLoginError('Initials must be 1-3 letters only');
                    return;
                }

                // Show loading state
                setLoadingState(true);
                hideLoginError();

                try {
                    const result = await LecturerAuth.loginLecturer(staffId, password, initials);

                    if (result.success) {
                        // Check if initials need confirmation
                        if (result.needsInitialsConfirmation) {
                            sessionStorage.setItem('tempSession', JSON.stringify(result.session));
                            window.location.href = 'setup-initials.html';
                        } else {
                            window.location.href = 'dashboard.html';
                        }
                    } else {
                        showLoginError(result.error || 'Login failed. Please try again.');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    showLoginError('An error occurred. Please try again.');
                } finally {
                    setLoadingState(false);
                }
            });

            // Password visibility toggle
            document.querySelector('.toggle-password').addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
            });

            function setLoadingState(loading) {
                loginBtn.disabled = loading;
                loginBtn.querySelector('.btn-text').classList.toggle('hidden', loading);
                loginBtn.querySelector('.btn-loader').classList.toggle('hidden', !loading);
            }

            function showLoginError(message) {
                loginError.textContent = message;
                loginError.classList.remove('hidden');
            }

            function hideLoginError() {
                loginError.classList.add('hidden');
            }
        });
    </script>
</body>
</html>

Initials Setup Page

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Your Initials - Attendly</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body class="setup-page">
    <div class="setup-container">
        <div class="setup-header">
            <div class="setup-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <h1>Setup Your Initials</h1>
            <p class="subtitle">Your initials will be stamped on all attendance codes you generate</p>
        </div>

        <div class="setup-card">
            <div class="current-info">
                <p>Welcome, <strong id="lecturerName"></strong></p>
                <p class="info-text">Staff ID: <span id="staffId"></span></p>
            </div>

            <form id="initialsForm" class="initials-form">
                <div class="form-group">
                    <label for="newInitials">Enter Your Preferred Initials</label>
                    <div class="initials-input-container">
                        <input type="text" id="newInitials"
                               class="initials-input"
                               maxlength="3"
                               placeholder="ABC"
                               autocomplete="off"
                               required>
                    </div>
                    <small class="helper-text">1-3 uppercase letters (e.g., JD for John Doe)</small>
                </div>

                <div class="initials-preview">
                    <p>Preview: Your codes will look like</p>
                    <div class="code-preview">
                        <span class="initials-preview-value" id="initialsPreview">ABC</span><span class="random-code">1234</span>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary btn-full" id="confirmBtn">
                        Confirm & Continue
                    </button>
                </div>
            </form>

            <div class="setup-info">
                <h3>Why do we need initials?</h3>
                <ul>
                    <li>Each attendance code includes your initials</li>
                    <li>Helps students verify the correct session</li>
                    <li>Prevents confusion in multi-lecturer courses</li>
                    <li>Cannot be changed after setup without admin approval</li>
                </ul>
            </div>
        </div>
    </div>

    <script src="js/supabase-client.js"></script>
    <script src="js/app.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            const tempSession = JSON.parse(sessionStorage.getItem('tempSession') || 'null');

            if (!tempSession) {
                window.location.href = 'index.html';
                return;
            }

            document.getElementById('lecturerName').textContent = tempSession.lecturer.full_name;
            document.getElementById('staffId').textContent = tempSession.lecturer.staff_id;

            const initialsInput = document.getElementById('newInitials');
            const initialsPreview = document.getElementById('initialsPreview');

            initialsInput.addEventListener('input', (e) => {
                let value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                e.target.value = value;
                initialsPreview.textContent = value || 'ABC';
            });

            document.getElementById('initialsForm').addEventListener('submit', async (e) => {
                e.preventDefault();

                const initials = initialsInput.value.trim().toUpperCase();

                if (!/^[A-Z]{1,3}$/.test(initials)) {
                    showToast('Please enter 1-3 letters only', 'error');
                    return;
                }

                const isTaken = await LecturerAPI.checkInitialsTaken(initials, tempSession.lecturer.id);
                if (isTaken) {
                    showToast('These initials are already taken by another lecturer', 'error');
                    return;
                }

                try {
                    const result = await LecturerAuth.confirmInitials(
                        tempSession.lecturer.id,
                        initials,
                        tempSession.session
                    );

                    if (result.success) {
                        sessionStorage.removeItem('tempSession');
                        window.location.href = 'dashboard.html';
                    } else {
                        showToast(result.error || 'Failed to save initials', 'error');
                    }
                } catch (error) {
                    console.error('Initials setup error:', error);
                    showToast('An error occurred. Please try again.', 'error');
                }
            });
        });
    </script>
</body>
</html>

Dashboard

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Attendly</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body class="dashboard-page">
    <header class="app-header">
        <div class="header-content">
            <div class="header-left">
                <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 12h18M3 6h18M3 18h18" stroke-width="2"/>
                    </svg>
                </button>
                <h1 class="page-title">Dashboard</h1>
            </div>
            <div class="header-right">
                <button class="notification-btn" id="notificationBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span class="notification-badge hidden" id="notificationBadge"></span>
                </button>
                <div class="user-menu">
                    <button class="user-menu-btn" id="userMenuBtn">
                        <div class="user-avatar">
                            <span id="userInitials"></span>
                        </div>
                    </button>
                    <div class="dropdown-menu hidden" id="userDropdown">
                        <div class="dropdown-header">
                            <strong id="userName"></strong>
                            <small id="userStaffId"></small>
                        </div>
                        <hr>
                        <a href="#" class="dropdown-item" id="profileLink">Profile Settings</a>
                        <a href="#" class="dropdown-item" id="helpLink">Help & Support</a>
                        <hr>
                        <button class="dropdown-item logout-btn" id="logoutBtn">Sign Out</button>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <nav class="side-nav" id="sideNav">
        <div class="nav-header">
            <img src="assets/logo.svg" alt="Attendly" class="nav-logo">
        </div>
        <ul class="nav-list">
            <li class="nav-item active">
                <a href="dashboard.html">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <span>Dashboard</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="create-session.html">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <span>New Session</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="pending-approvals.html">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 11l3 3L22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <span>Pending Approvals</span>
                    <span class="nav-badge hidden" id="pendingBadge"></span>
                </a>
            </li>
            <li class="nav-item">
                <a href="attendance-records.html">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span>Attendance Records</span>
                </a>
            </li>
            <li class="nav-item">
                <a href="no-class.html">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                    <span>No Class</span>
                </a>
            </li>
        </ul>
    </nav>

    <main class="main-content">
        <section class="quick-actions">
            <h2>Quick Actions</h2>
            <div class="action-cards">
                <a href="create-session.html" class="action-card primary">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div class="action-content">
                        <h3>Create Session</h3>
                        <p>Start a new attendance session</p>
                    </div>
                </a>

                <a href="no-class.html" class="action-card secondary">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                    </div>
                    <div class="action-content">
                        <h3>No Class</h3>
                        <p>Mark a cancelled class</p>
                    </div>
                </a>

                <a href="manual-attendance.html" class="action-card tertiary">
                    <div class="action-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="8.5" cy="7" r="4"/>
                            <line x1="20" y1="8" x2="20" y2="14"/>
                            <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                    </div>
                    <div class="action-content">
                        <h3>Manual Add</h3>
                        <p>Add student manually</p>
                    </div>
                </a>
            </div>
        </section>

        <section class="active-sessions">
            <div class="section-header">
                <h2>Active Sessions</h2>
                <span class="session-count" id="activeSessionCount">0</span>
            </div>
            <div class="sessions-list" id="activeSessionsList">
                <div class="empty-state" id="noActiveSessions">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <p>No active sessions</p>
                    <a href="create-session.html" class="btn btn-secondary">Create Session</a>
                </div>
            </div>
        </section>

        <section class="today-schedule">
            <div class="section-header">
                <h2>Today's Schedule</h2>
                <span class="date-today" id="dateToday"></span>
            </div>
            <div class="schedule-list" id="scheduleList"></div>
        </section>

        <section class="recent-attendance">
            <div class="section-header">
                <h2>Recent Sessions</h2>
                <a href="attendance-records.html" class="view-all-link">View All</a>
            </div>
            <div class="attendance-list" id="recentAttendanceList"></div>
        </section>

        <section class="stats-overview">
            <h2>This Week's Statistics</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon sessions">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value" id="weeklySessions">0</span>
                        <span class="stat-label">Sessions</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon attendance">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value" id="weeklyAttendance">0</span>
                        <span class="stat-label">Total Attendance</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon pending">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value" id="pendingApprovals">0</span>
                        <span class="stat-label">Pending Approvals</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon rate">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="12" y1="20" x2="12" y2="10"/>
                            <line x1="18" y1="20" x2="18" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="16"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value" id="avgAttendanceRate">0%</span>
                        <span class="stat-label">Avg Attendance Rate</span>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <div class="toast-container" id="toastContainer"></div>

    <script src="js/supabase-client.js"></script>
    <script src="js/session-manager.js"></script>
    <script src="js/realtime.js"></script>
    <script src="js/app.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            const lecturer = await LecturerAuth.getCurrentLecturer();
            if (!lecturer) {
                window.location.href = 'index.html';
                return;
            }

            await initDashboard(lecturer);
            await setupRealtimeSubscriptions(lecturer.id);
            setupEventListeners();
        });

        async function initDashboard(lecturer) {
            document.getElementById('userInitials').textContent = lecturer.initials;
            document.getElementById('userName').textContent = lecturer.full_name;
            document.getElementById('userStaffId').textContent = lecturer.staff_id;

            const today = new Date();
            document.getElementById('dateToday').textContent = today.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            await Promise.all([
                loadActiveSessions(lecturer.id),
                loadTodaySchedule(lecturer.id),
                loadRecentAttendance(lecturer.id),
                loadWeeklyStats(lecturer.id),
                loadPendingCount(lecturer.id)
            ]);
        }

        async function loadActiveSessions(lecturerId) {
            try {
                const sessions = await SessionAPI.getLecturerActiveSessions(lecturerId);
                const container = document.getElementById('activeSessionsList');
                const noSessions = document.getElementById('noActiveSessions');
                const countBadge = document.getElementById('activeSessionCount');

                countBadge.textContent = sessions.length;

                if (sessions.length === 0) {
                    noSessions.classList.remove('hidden');
                    return;
                }

                noSessions.classList.add('hidden');
                container.innerHTML = sessions.map(session => createSessionCard(session)).join('');

                container.querySelectorAll('.session-card').forEach(card => {
                    card.addEventListener('click', () => {
                        window.location.href = `live-session.html?id=${card.dataset.sessionId}`;
                    });
                });
            } catch (error) {
                console.error('Error loading active sessions:', error);
                showToast('Failed to load active sessions', 'error');
            }
        }

        function createSessionCard(session) {
            const timeRemaining = Math.max(0,
                Math.floor((new Date(session.expires_at) - new Date()) / 1000 / 60)
            );
            const isExpiring = timeRemaining <= 5;

            return `
                <div class="session-card ${isExpiring ? 'expiring' : ''}" data-session-id="${session.id}">
                    <div class="session-header">
                        <h4>${session.course_code}</h4>
                        <span class="session-code">${session.session_code}</span>
                    </div>
                    <div class="session-details">
                        <div class="session-stat">
                            <span class="label">Attendance</span>
                            <span class="value">${session.attendance_count || 0}/${session.expected_students || '?'}</span>
                        </div>
                        <div class="session-stat">
                            <span class="label">Time Left</span>
                            <span class="value ${isExpiring ? 'warning' : ''}">${timeRemaining}m</span>
                        </div>
                    </div>
                    <div class="session-progress">
                        <div class="progress-bar" style="width: ${calculateProgress(session)}%"></div>
                    </div>
                    <div class="session-footer">
                        <span class="room">${session.room_name || 'No Room'}</span>
                        <span class="status active">Active</span>
                    </div>
                </div>
            `;
        }

        function calculateProgress(session) {
            if (!session.expected_students || session.expected_students === 0) return 0;
            return Math.min(100, ((session.attendance_count || 0) / session.expected_students) * 100);
        }

        function setupEventListeners() {
            document.getElementById('menuToggle').addEventListener('click', () => {
                document.getElementById('sideNav').classList.toggle('open');
            });

            const userMenuBtn = document.getElementById('userMenuBtn');
            const userDropdown = document.getElementById('userDropdown');

            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.add('hidden');
            });

            document.getElementById('logoutBtn').addEventListener('click', async () => {
                await LecturerAuth.signOut();
                window.location.href = 'index.html';
            });

            document.getElementById('notificationBtn').addEventListener('click', () => {
                window.location.href = 'notifications.html';
            });
        }
    </script>
</body>
</html>

Session Creation

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Session - Attendly</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body class="create-session-page">
    <header class="app-header">
        <div class="header-content">
            <a href="dashboard.html" class="back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="page-title">Create Session</h1>
        </div>
    </header>

    <main class="main-content">
        <form id="sessionForm" class="session-form">
            <div class="form-section">
                <h2>Select Course</h2>
                <div class="form-group">
                    <label for="courseSelect">Course</label>
                    <select id="courseSelect" required>
                        <option value="">Select a course</option>
                    </select>
                </div>

                <div class="course-info hidden" id="courseInfo">
                    <div class="info-item">
                        <span class="label">Course Code:</span>
                        <span class="value" id="courseCode"></span>
                    </div>
                    <div class="info-item">
                        <span class="label">Expected Students:</span>
                        <span class="value" id="expectedStudents"></span>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2>Location</h2>
                <div class="form-group">
                    <label for="roomSelect">Room</label>
                    <select id="roomSelect" required>
                        <option value="">Select a room</option>
                    </select>
                </div>

                <div class="room-info hidden" id="roomInfo">
                    <div class="gps-info">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>GPS verification will be enabled for this room</span>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2>Session Settings</h2>

                <div class="form-group">
                    <label for="duration">Duration (minutes)</label>
                    <div class="duration-selector">
                        <button type="button" class="duration-btn" data-minutes="5">5</button>
                        <button type="button" class="duration-btn active" data-minutes="10">10</button>
                        <button type="button" class="duration-btn" data-minutes="15">15</button>
                        <button type="button" class="duration-btn" data-minutes="20">20</button>
                        <button type="button" class="duration-btn" data-minutes="30">30</button>
                    </div>
                    <input type="hidden" id="duration" value="10">
                </div>

                <div class="form-group">
                    <div class="toggle-group">
                        <label for="gpsRequired">Require GPS Verification</label>
                        <label class="toggle">
                            <input type="checkbox" id="gpsRequired" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <small class="helper-text">Students must be within 50m of the room to check in</small>
                </div>
            </div>

            <div class="form-section preview-section">
                <h2>Session Preview</h2>
                <div class="preview-card">
                    <div class="preview-code">
                        <span class="code-label">Session Code</span>
                        <span class="code-value" id="previewCode">JD1234</span>
                    </div>
                    <div class="preview-details">
                        <div class="preview-item">
                            <span class="label">Course:</span>
                            <span class="value" id="previewCourse">-</span>
                        </div>
                        <div class="preview-item">
                            <span class="label">Room:</span>
                            <span class="value" id="previewRoom">-</span>
                        </div>
                        <div class="preview-item">
                            <span class="label">Duration:</span>
                            <span class="value" id="previewDuration">10 minutes</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="window.location.href='dashboard.html'">
                    Cancel
                </button>
                <button type="submit" class="btn btn-primary" id="createBtn">
                    <span class="btn-text">Create Session</span>
                </button>
            </div>
        </form>
    </main>

    <div class="toast-container" id="toastContainer"></div>

    <script src="js/supabase-client.js"></script>
    <script src="js/app.js"></script>
    <script>
        let lecturerData = null;
        let selectedCourse = null;
        let selectedRoom = null;

        document.addEventListener('DOMContentLoaded', async () => {
            lecturerData = await LecturerAuth.getCurrentLecturer();
            if (!lecturerData) {
                window.location.href = 'index.html';
                return;
            }

            await loadCourses();
            await loadRooms();
            setupEventListeners();
            updatePreview();
        });

        async function loadCourses() {
            try {
                const courses = await LecturerAPI.getMyCourses(lecturerData.id);
                const select = document.getElementById('courseSelect');

                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = `${course.code} - ${course.name}`;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading courses:', error);
                showToast('Failed to load courses', 'error');
            }
        }

        async function loadRooms() {
            try {
                const rooms = await RoomAPI.getAllRooms();
                const select = document.getElementById('roomSelect');

                rooms.forEach(room => {
                    const option = document.createElement('option');
                    option.value = room.id;
                    option.textContent = `${room.name} (${room.building})`;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading rooms:', error);
                showToast('Failed to load rooms', 'error');
            }
        }

        function setupEventListeners() {
            document.getElementById('courseSelect').addEventListener('change', (e) => {
                const selected = e.target.selectedOptions[0];
                if (selected && selected.value) {
                    selectedCourse = { id: selected.value, code: selected.textContent.split(' - ')[0] };
                    document.getElementById('courseCode').textContent = selectedCourse.code;
                    document.getElementById('courseInfo').classList.remove('hidden');
                } else {
                    selectedCourse = null;
                    document.getElementById('courseInfo').classList.add('hidden');
                }
                updatePreview();
            });

            document.getElementById('roomSelect').addEventListener('change', (e) => {
                const selected = e.target.selectedOptions[0];
                if (selected && selected.value) {
                    selectedRoom = { id: selected.value, name: selected.textContent.split(' (')[0] };
                    document.getElementById('roomInfo').classList.remove('hidden');
                } else {
                    selectedRoom = null;
                    document.getElementById('roomInfo').classList.add('hidden');
                }
                updatePreview();
            });

            document.querySelectorAll('.duration-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('duration').value = btn.dataset.minutes;
                    updatePreview();
                });
            });

            document.getElementById('sessionForm').addEventListener('submit', handleCreateSession);
        }

        function updatePreview() {
            const duration = document.getElementById('duration').value;
            const previewCode = lecturerData.initials + Math.floor(1000 + Math.random() * 9000);
            document.getElementById('previewCode').textContent = previewCode;
            document.getElementById('previewCourse').textContent = selectedCourse ? selectedCourse.code : '-';
            document.getElementById('previewRoom').textContent = selectedRoom ? selectedRoom.name : '-';
            document.getElementById('previewDuration').textContent = `${duration} minutes`;
        }

        async function handleCreateSession(e) {
            e.preventDefault();

            if (!selectedCourse || !selectedRoom) {
                showToast('Please select a course and room', 'error');
                return;
            }

            const createBtn = document.getElementById('createBtn');
            createBtn.disabled = true;

            try {
                const sessionData = {
                    courseId: selectedCourse.id,
                    roomId: selectedRoom.id,
                    duration: parseInt(document.getElementById('duration').value),
                    gpsRequired: document.getElementById('gpsRequired').checked
                };

                const result = await SessionAPI.createSession(sessionData);

                if (result.success) {
                    showToast('Session created successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = `live-session.html?id=${result.session.id}`;
                    }, 1000);
                } else {
                    showToast(result.error || 'Failed to create session', 'error');
                    createBtn.disabled = false;
                }
            } catch (error) {
                console.error('Session creation error:', error);
                showToast('An error occurred. Please try again.', 'error');
                createBtn.disabled = false;
            }
        }
    </script>
</body>
</html>

Live Session View

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Session - Attendly</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body class="live-session-page">
    <header class="app-header">
        <div class="header-content">
            <a href="dashboard.html" class="back-btn" id="backBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="page-title">Live Session</h1>
            <button class="btn btn-outline" id="endSessionBtn">End Session</button>
        </div>
    </header>

    <main class="main-content live-session-container">
        <div class="session-header-card">
            <div class="session-code-display">
                <span class="code" id="sessionCode">JD1234</span>
                <button class="copy-btn" id="copyCodeBtn" title="Copy code">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                </button>
            </div>
            <div class="session-meta">
                <div class="meta-item">
                    <span class="label">Course</span>
                    <span class="value" id="courseCode">CSC 201</span>
                </div>
                <div class="meta-item">
                    <span class="label">Room</span>
                    <span class="value" id="roomName">LT1</span>
                </div>
            </div>
        </div>

        <div class="timer-section">
            <div class="timer-display" id="timerDisplay">10:00</div>
            <div class="timer-actions">
                <button class="btn btn-outline" id="extendBtn">Add 5 min</button>
            </div>
        </div>

        <div class="qr-section">
            <h3>Scan QR Code</h3>
            <div class="qr-code" id="qrCode"></div>
            <p class="helper-text">Students can scan this code to quickly access the check-in page</p>
        </div>

        <div class="attendance-feed">
            <div class="feed-header">
                <h3>Attendance Feed</h3>
                <div>
                    <span class="feed-count" id="attendanceCount">0</span>
                    <span class="label">/ <span id="expectedCount">?</span> students</span>
                </div>
            </div>

            <div class="progress-bar-container">
                <div class="progress-bar" id="attendanceProgress" style="width: 0%"></div>
            </div>

            <div class="feed-list" id="attendanceFeed">
                <div class="empty-state" id="noAttendance">
                    <p>Waiting for students to check in...</p>
                </div>
            </div>
        </div>

        <div class="session-actions">
            <a href="pending-approvals.html" class="btn btn-outline" id="pendingBtn">
                <span>Pending Approvals</span>
                <span class="badge hidden" id="pendingBadge">0</span>
            </a>
            <a href="manual-attendance.html" class="btn btn-secondary">
                Add Student Manually
            </a>
        </div>
    </main>

    <div class="modal hidden" id="endSessionModal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>End Session</h3>
                <button class="modal-close" id="closeModal">&amp;times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to end this session?</p>
                <div class="session-summary">
                    <div class="summary-item">
                        <span class="label">Total Attendance</span>
                        <span class="value" id="summaryAttendance">0</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancelEnd">Cancel</button>
                <button class="btn btn-danger" id="confirmEnd">End Session</button>
            </div>
        </div>
    </div>

    <div class="toast-container" id="toastContainer"></div>

    <script src="js/supabase-client.js"></script>
    <script src="js/qr-generator.js"></script>
    <script src="js/realtime.js"></script>
    <script src="js/app.js"></script>
    <script>
        let sessionData = null;
        let timerInterval = null;
        let timeRemaining = 0;

        document.addEventListener('DOMContentLoaded', async () => {
            const lecturer = await LecturerAuth.getCurrentLecturer();
            if (!lecturer) {
                window.location.href = 'index.html';
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('id');

            if (!sessionId) {
                window.location.href = 'dashboard.html';
                return;
            }

            await loadSession(sessionId);
            await setupRealtime(sessionId);
            setupEventHandlers();
        });

        async function loadSession(sessionId) {
            try {
                sessionData = await SessionAPI.getSessionById(sessionId);

                if (!sessionData || sessionData.status !== 'active') {
                    showToast('Session not found or has ended', 'error');
                    window.location.href = 'dashboard.html';
                    return;
                }

                document.getElementById('sessionCode').textContent = sessionData.session_code;
                document.getElementById('courseCode').textContent = sessionData.course_code;
                document.getElementById('roomName').textContent = sessionData.room_name;
                document.getElementById('expectedCount').textContent = sessionData.expected_students || '?';

                const expiresAt = new Date(sessionData.expires_at);
                timeRemaining = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));
                startTimer();

                await loadAttendance();
                generateQRCode(sessionData.session_code);
                await loadPendingCount();
            } catch (error) {
                console.error('Error loading session:', error);
                showToast('Failed to load session', 'error');
            }
        }

        async function loadAttendance() {
            try {
                const attendance = await SessionAPI.getSessionAttendance(sessionData.id);
                updateAttendanceUI(attendance);
            } catch (error) {
                console.error('Error loading attendance:', error);
            }
        }

        function updateAttendanceUI(attendance) {
            const count = attendance.length;
            const expected = sessionData.expected_students || 0;

            document.getElementById('attendanceCount').textContent = count;

            if (expected > 0) {
                const progress = (count / expected) * 100;
                document.getElementById('attendanceProgress').style.width = `${progress}%`;
            }

            if (count > 0) {
                const feed = document.getElementById('attendanceFeed');
                attendance.sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));

                feed.innerHTML = attendance.map(item => `
                    <div class="feed-item" data-id="${item.id}">
                        <div class="avatar">${item.student_name.charAt(0)}</div>
                        <div class="info">
                            <div class="name">${item.student_name}</div>
                            <div class="matric">${item.matric_number}</div>
                        </div>
                        <span class="status-badge ${item.status}">${item.status}</span>
                    </div>
                `).join('');
            }
        }

        function startTimer() {
            updateTimerDisplay();
            timerInterval = setInterval(() => {
                if (timeRemaining > 0) {
                    timeRemaining--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    handleSessionExpired();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            const display = document.getElementById('timerDisplay');
            display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            display.classList.remove('warning', 'critical');
            if (timeRemaining <= 60) {
                display.classList.add('critical');
            } else if (timeRemaining <= 300) {
                display.classList.add('warning');
            }
        }

        async function setupRealtime(sessionId) {
            await RealtimeManager.subscribeToSession(sessionId, {
                onNewAttendance: (data) => {
                    addNewAttendanceItem(data);
                    showToast(`${data.student_name} just checked in!`, 'success');
                },
                onSessionUpdate: (data) => {
                    if (data.status === 'ended') handleSessionExpired();
                }
            });
        }

        function addNewAttendanceItem(data) {
            const feed = document.getElementById('attendanceFeed');
            const newItem = document.createElement('div');
            newItem.className = 'feed-item';
            newItem.innerHTML = `
                <div class="avatar">${data.student_name.charAt(0)}</div>
                <div class="info">
                    <div class="name">${data.student_name}</div>
                    <div class="matric">${data.matric_number}</div>
                </div>
                <span class="status-badge ${data.status}">${data.status}</span>
            `;
            feed.insertBefore(newItem, feed.firstChild);

            const countEl = document.getElementById('attendanceCount');
            countEl.textContent = parseInt(countEl.textContent) + 1;
        }

        function generateQRCode(code) {
            const qrContainer = document.getElementById('qrCode');
            const checkInUrl = `${window.location.origin}/student/check-in.html?code=${code}`;
            new QRCode(qrContainer, {
                text: checkInUrl,
                width: 200,
                height: 200,
                colorDark: '#1a365d',
                colorLight: '#ffffff'
            });
        }

        async function loadPendingCount() {
            try {
                const count = await AttendanceAPI.getPendingApprovalsCount(sessionData.lecturer_id);
                const badge = document.getElementById('pendingBadge');
                if (count > 0) {
                    badge.textContent = count;
                    badge.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error loading pending count:', error);
            }
        }

        function setupEventHandlers() {
            document.getElementById('copyCodeBtn').addEventListener('click', () => {
                navigator.clipboard.writeText(sessionData.session_code);
                showToast('Code copied to clipboard!', 'success');
            });

            document.getElementById('extendBtn').addEventListener('click', async () => {
                try {
                    const result = await SessionAPI.extendSession(sessionData.id, 5);
                    if (result.success) {
                        timeRemaining += 300;
                        showToast('Session extended by 5 minutes', 'success');
                    }
                } catch (error) {
                    showToast('Failed to extend session', 'error');
                }
            });

            document.getElementById('endSessionBtn').addEventListener('click', () => {
                document.getElementById('endSessionModal').classList.remove('hidden');
            });

            document.getElementById('closeModal').addEventListener('click', hideEndSessionModal);
            document.getElementById('cancelEnd').addEventListener('click', hideEndSessionModal);

            document.getElementById('confirmEnd').addEventListener('click', async () => {
                await endSession();
            });
        }

        function hideEndSessionModal() {
            document.getElementById('endSessionModal').classList.add('hidden');
        }

        async function endSession() {
            try {
                const result = await SessionAPI.endSession(sessionData.id);
                if (result.success) {
                    clearInterval(timerInterval);
                    showToast('Session ended successfully', 'success');
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
                }
            } catch (error) {
                console.error('Error ending session:', error);
                showToast('Failed to end session', 'error');
            }
        }

        function handleSessionExpired() {
            clearInterval(timerInterval);
            showToast('Session has expired', 'info');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
        }
    </script>
</body>
</html>

Pending Approvals

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pending Approvals - Attendly</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body class="pending-approvals-page">
    <header class="app-header">
        <div class="header-content">
            <a href="dashboard.html" class="back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="page-title">Pending Approvals</h1>
        </div>
    </header>

    <main class="main-content">
        <div class="info-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p>These students attempted to check in from a different device. Please verify before approving.</p>
        </div>

        <div class="pending-list" id="pendingList"></div>

        <div class="empty-state hidden" id="noPending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3>All caught up!</h3>
            <p>No pending approvals at this time.</p>
            <a href="dashboard.html" class="btn btn-primary">Back to Dashboard</a>
        </div>
    </main>

    <div class="modal hidden" id="detailModal">
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3>Approval Request</h3>
                <button class="modal-close" id="closeDetailModal">&amp;times;</button>
            </div>
            <div class="modal-body">
                <div class="student-info-card">
                    <div class="student-avatar"><span id="modalStudentInitial"></span></div>
                    <div class="student-details">
                        <h4 id="modalStudentName"></h4>
                        <p id="modalMatric"></p>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Request Details</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="label">Course</span>
                            <span class="value" id="modalCourse"></span>
                        </div>
                        <div class="detail-item">
                            <span class="label">Session Code</span>
                            <span class="value" id="modalSessionCode"></span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Device Information</h4>
                    <div class="device-comparison">
                        <div class="device-card registered">
                            <h5>Registered Device</h5>
                            <div id="modalRegisteredDevice"></div>
                        </div>
                        <div class="device-card current">
                            <h5>Current Device</h5>
                            <div id="modalCurrentDevice"></div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="rejectionReason">Rejection Reason (if rejecting)</label>
                    <textarea id="rejectionReason" placeholder="Optional reason for rejection..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-danger" id="rejectBtn">Reject</button>
                <button class="btn btn-success" id="approveBtn">Approve</button>
            </div>
        </div>
    </div>

    <div class="toast-container" id="toastContainer"></div>

    <script src="js/supabase-client.js"></script>
    <script src="js/realtime.js"></script>
    <script src="js/app.js"></script>
    <script>
        let lecturerData = null;
        let currentRequest = null;
        let pendingRequests = [];

        document.addEventListener('DOMContentLoaded', async () => {
            lecturerData = await LecturerAuth.getCurrentLecturer();
            if (!lecturerData) {
                window.location.href = 'index.html';
                return;
            }

            await loadPendingApprovals();
            setupEventListeners();
            setupRealtimeSubscription();
        });

        async function loadPendingApprovals() {
            try {
                pendingRequests = await AttendanceAPI.getPendingApprovals(lecturerData.id);
                renderPendingList();
            } catch (error) {
                console.error('Error loading pending approvals:', error);
                showToast('Failed to load pending approvals', 'error');
            }
        }

        function renderPendingList() {
            const container = document.getElementById('pendingList');
            const emptyState = document.getElementById('noPending');

            if (pendingRequests.length === 0) {
                container.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            container.classList.remove('hidden');
            emptyState.classList.add('hidden');

            container.innerHTML = pendingRequests.map(request => `
                <div class="pending-card" data-id="${request.id}">
                    <div class="pending-header">
                        <div class="student-info">
                            <div class="avatar">${request.student_name.charAt(0)}</div>
                            <div>
                                <h4>${request.student_name}</h4>
                                <p>${request.matric_number}</p>
                            </div>
                        </div>
                        <span class="time-badge">${formatTimeAgo(request.request_time)}</span>
                    </div>

                    <div class="pending-details">
                        <div class="detail-row">
                            <span class="label">Course:</span>
                            <span class="value">${request.course_code}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Session:</span>
                            <span class="value">${request.session_code}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Reason:</span>
                            <span class="value highlight">Device mismatch detected</span>
                        </div>
                    </div>

                    <div class="pending-actions">
                        <button class="btn btn-sm btn-outline view-btn" data-id="${request.id}">View Details</button>
                        <button class="btn btn-sm btn-danger reject-btn" data-id="${request.id}">Reject</button>
                        <button class="btn btn-sm btn-success approve-btn" data-id="${request.id}">Approve</button>
                    </div>
                </div>
            `).join('');

            container.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => showDetailModal(btn.dataset.id));
            });

            container.querySelectorAll('.approve-btn').forEach(btn => {
                btn.addEventListener('click', () => handleApproval(btn.dataset.id, true));
            });

            container.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', () => handleApproval(btn.dataset.id, false));
            });
        }

        function showDetailModal(requestId) {
            currentRequest = pendingRequests.find(r => r.id === requestId);
            if (!currentRequest) return;

            document.getElementById('modalStudentInitial').textContent = currentRequest.student_name.charAt(0);
            document.getElementById('modalStudentName').textContent = currentRequest.student_name;
            document.getElementById('modalMatric').textContent = currentRequest.matric_number;
            document.getElementById('modalCourse').textContent = currentRequest.course_code;
            document.getElementById('modalSessionCode').textContent = currentRequest.session_code;

            document.getElementById('modalRegisteredDevice').innerHTML = `
                <p><strong>Browser:</strong> ${currentRequest.registered_device?.browser || 'Unknown'}</p>
                <p><strong>OS:</strong> ${currentRequest.registered_device?.os || 'Unknown'}</p>
            `;

            document.getElementById('modalCurrentDevice').innerHTML = `
                <p><strong>Browser:</strong> ${currentRequest.current_device?.browser || 'Unknown'}</p>
                <p><strong>OS:</strong> ${currentRequest.current_device?.os || 'Unknown'}</p>
            `;

            document.getElementById('detailModal').classList.remove('hidden');
        }

        function setupEventListeners() {
            document.getElementById('closeDetailModal').addEventListener('click', () => {
                document.getElementById('detailModal').classList.add('hidden');
            });

            document.getElementById('approveBtn').addEventListener('click', () => {
                if (currentRequest) {
                    handleApproval(currentRequest.id, true);
                    document.getElementById('detailModal').classList.add('hidden');
                }
            });

            document.getElementById('rejectBtn').addEventListener('click', () => {
                if (currentRequest) {
                    const reason = document.getElementById('rejectionReason').value;
                    handleApproval(currentRequest.id, false, reason);
                    document.getElementById('detailModal').classList.add('hidden');
                }
            });
        }

        async function handleApproval(requestId, approved, reason = null) {
            try {
                const result = await AttendanceAPI.processDeviceMismatchApproval({
                    requestId,
                    approved,
                    reason,
                    lecturerId: lecturerData.id
                });

                if (result.success) {
                    pendingRequests = pendingRequests.filter(r => r.id !== requestId);
                    renderPendingList();
                    showToast(approved ? 'Attendance approved successfully' : 'Attendance rejected', approved ? 'success' : 'info');
                } else {
                    showToast(result.error || 'Failed to process approval', 'error');
                }
            } catch (error) {
                console.error('Error processing approval:', error);
                showToast('An error occurred', 'error');
            }
        }

        function setupRealtimeSubscription() {
            RealtimeManager.subscribeToPendingApprovals(lecturerData.id, (newRequest) => {
                pendingRequests.unshift(newRequest);
                renderPendingList();
                showToast(`New approval request from ${newRequest.student_name}`, 'info');
            });
        }

        function formatTimeAgo(timestamp) {
            const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
            if (seconds < 60) return 'Just now';
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            return `${Math.floor(seconds / 3600)}h ago`;
        }
    </script>
</body>
</html>

Manual Attendance

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual Attendance - Attendly</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body class="manual-attendance-page">
    <header class="app-header">
        <div class="header-content">
            <a href="dashboard.html" class="back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="page-title">Manual Attendance</h1>
        </div>
    </header>

    <main class="main-content">
        <div class="info-banner warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p>Manual attendance should only be used when a student cannot check in through the normal process. All manual additions are logged for audit purposes.</p>
        </div>

        <form id="manualAttendanceForm" class="form-card">
            <div class="form-section">
                <h2>Session Selection</h2>
                <div class="form-group">
                    <label for="sessionSelect">Active Session</label>
                    <select id="sessionSelect" required>
                        <option value="">Select an active session</option>
                    </select>
                </div>
            </div>

            <div class="form-section">
                <h2>Student Selection</h2>
                <div class="form-group">
                    <label for="studentSearch">Search Student</label>
                    <input type="text" id="studentSearch" placeholder="Enter name or matric number..." autocomplete="off">
                    <div class="search-results hidden" id="searchResults"></div>
                </div>

                <div class="selected-student hidden" id="selectedStudent">
                    <div class="student-card">
                        <div class="student-avatar"><span id="studentInitial"></span></div>
                        <div class="student-details">
                            <h4 id="studentName"></h4>
                            <p id="studentMatric"></p>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline" id="clearStudent">Change</button>
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h2>Reason for Manual Addition</h2>
                <div class="form-group">
                    <label>Reason</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="reason" value="technical" required>
                            <span class="radio-label">Technical Issue</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="reason" value="device">
                            <span class="radio-label">Device Problem</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="reason" value="network">
                            <span class="radio-label">Network/Connectivity</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="reason" value="other">
                            <span class="radio-label">Other</span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label for="notes">Additional Notes</label>
                    <textarea id="notes" rows="3" placeholder="Provide any additional details..."></textarea>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="window.location.href='dashboard.html'">Cancel</button>
                <button type="submit" class="btn btn-primary" id="submitBtn">Add Attendance</button>
            </div>
        </form>
    </main>

    <div class="toast-container" id="toastContainer"></div>

    <script src="js/supabase-client.js"></script>
    <script src="js/app.js"></script>
    <script>
        let lecturerData = null;
        let selectedSession = null;
        let selectedStudent = null;
        let searchTimeout = null;

        document.addEventListener('DOMContentLoaded', async () => {
            lecturerData = await LecturerAuth.getCurrentLecturer();
            if (!lecturerData) {
                window.location.href = 'index.html';
                return;
            }

            await loadActiveSessions();
            setupEventListeners();
        });

        async function loadActiveSessions() {
            try {
                const sessions = await SessionAPI.getLecturerActiveSessions(lecturerData.id);
                const select = document.getElementById('sessionSelect');

                sessions.forEach(session => {
                    const option = document.createElement('option');
                    option.value = session.id;
                    option.textContent = `${session.course_code} - ${session.session_code}`;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading sessions:', error);
            }
        }

        function setupEventListeners() {
            document.getElementById('sessionSelect').addEventListener('change', (e) => {
                selectedSession = e.target.value ? { id: e.target.value } : null;
            });

            document.getElementById('studentSearch').addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                if (query.length < 2) {
                    document.getElementById('searchResults').classList.add('hidden');
                    return;
                }
                searchTimeout = setTimeout(() => searchStudents(query), 300);
            });

            document.getElementById('clearStudent').addEventListener('click', () => {
                selectedStudent = null;
                document.getElementById('selectedStudent').classList.add('hidden');
                document.getElementById('studentSearch').value = '';
                document.getElementById('studentSearch').disabled = false;
            });

            document.getElementById('manualAttendanceForm').addEventListener('submit', handleSubmit);
        }

        async function searchStudents(query) {
            try {
                const results = await StudentAPI.searchStudents(query);
                const container = document.getElementById('searchResults');

                container.innerHTML = results.map(student => `
                    <div class="search-result-item" data-id="${student.id}" data-name="${student.full_name}" data-matric="${student.matric_number}">
                        <strong>${student.full_name}</strong>
                        <span>${student.matric_number}</span>
                    </div>
                `).join('');

                container.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', () => selectStudent(item));
                });

                container.classList.remove('hidden');
            } catch (error) {
                console.error('Error searching students:', error);
            }
        }

        function selectStudent(item) {
            selectedStudent = {
                id: item.dataset.id,
                name: item.dataset.name,
                matric: item.dataset.matric
            };

            document.getElementById('studentInitial').textContent = selectedStudent.name.charAt(0);
            document.getElementById('studentName').textContent = selectedStudent.name;
            document.getElementById('studentMatric').textContent = selectedStudent.matric;

            document.getElementById('selectedStudent').classList.remove('hidden');
            document.getElementById('searchResults').classList.add('hidden');
            document.getElementById('studentSearch').disabled = true;
        }

        async function handleSubmit(e) {
            e.preventDefault();

            if (!selectedSession || !selectedStudent) {
                showToast('Please select a session and student', 'error');
                return;
            }

            const reason = document.querySelector('input[name="reason"]:checked')?.value;
            if (!reason) {
                showToast('Please select a reason', 'error');
                return;
            }

            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;

            try {
                const result = await AttendanceAPI.manualAddStudent({
                    sessionId: selectedSession.id,
                    studentId: selectedStudent.id,
                    reason,
                    notes: document.getElementById('notes').value,
                    lecturerId: lecturerData.id
                });

                if (result.success) {
                    showToast('Attendance added successfully', 'success');
                    document.getElementById('manualAttendanceForm').reset();
                    selectedStudent = null;
                    document.getElementById('selectedStudent').classList.add('hidden');
                    document.getElementById('studentSearch').disabled = false;
                } else {
                    showToast(result.error || 'Failed to add attendance', 'error');
                }
            } catch (error) {
                console.error('Error adding attendance:', error);
                showToast('An error occurred', 'error');
            } finally {
                submitBtn.disabled = false;
            }
        }
    </script>
</body>
</html>

Attendance Records

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance Records - Attendly</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
</head>
<body class="records-page">
    <header class="app-header">
        <div class="header-content">
            <a href="dashboard.html" class="back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </a>
            <h1 class="page-title">Attendance Records</h1>
        </div>
    </header>

    <main class="main-content">
        <div class="filters-section">
            <div class="filter-row">
                <div class="filter-group">
                    <label for="courseFilter">Course</label>
                    <select id="courseFilter"><option value="">All Courses</option></select>
                </div>
                <div class="filter-group">
                    <label for="dateFrom">From</label>
                    <input type="date" id="dateFrom">
                </div>
                <div class="filter-group">
                    <label for="dateTo">To</label>
                    <input type="date" id="dateTo">
                </div>
                <button class="btn btn-primary" id="applyFilters">Apply</button>
                <button class="btn btn-outline" id="clearFilters">Clear</button>
            </div>
        </div>

        <div class="summary-cards">
            <div class="summary-card">
                <div class="summary-value" id="totalSessions">0</div>
                <div class="summary-label">Total Sessions</div>
            </div>
            <div class="summary-card">
                <div class="summary-value" id="totalAttendance">0</div>
                <div class="summary-label">Total Attendance</div>
            </div>
            <div class="summary-card">
                <div class="summary-value" id="avgRate">0%</div>
                <div class="summary-label">Avg. Rate</div>
            </div>
        </div>

        <div class="records-table-container">
            <div class="table-header">
                <h3>Sessions</h3>
                <div class="export-buttons">
                    <button class="btn btn-sm btn-outline" id="exportCsv">CSV</button>
                    <button class="btn btn-sm btn-outline" id="exportPdf">PDF</button>
                </div>
            </div>

            <table class="records-table" id="recordsTable">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Session Code</th>
                        <th>Type</th>
                        <th>Attendance</th>
                        <th>Rate</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="recordsBody"></tbody>
            </table>

            <div class="pagination" id="pagination"></div>
        </div>
    </main>

    <div class="toast-container" id="toastContainer"></div>

    <script src="js/supabase-client.js"></script>
    <script src="js/export.js"></script>
    <script src="js/app.js"></script>
    <script>
        let lecturerData = null;
        let records = [];
        let currentPage = 1;
        const pageSize = 20;
        let filters = { courseId: null, dateFrom: null, dateTo: null };

        document.addEventListener('DOMContentLoaded', async () => {
            lecturerData = await LecturerAuth.getCurrentLecturer();
            if (!lecturerData) {
                window.location.href = 'index.html';
                return;
            }

            await loadCourseFilter();
            await loadRecords();
            setupEventListeners();
        });

        async function loadCourseFilter() {
            const courses = await LecturerAPI.getMyCourses(lecturerData.id);
            const select = document.getElementById('courseFilter');
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.code} - ${course.name}`;
                select.appendChild(option);
            });
        }

        async function loadRecords() {
            try {
                const result = await LecturerAPI.getAttendanceRecords({
                    lecturerId: lecturerData.id,
                    ...filters,
                    page: currentPage,
                    pageSize
                });

                records = result.records;

                document.getElementById('totalSessions').textContent = result.summary.totalSessions;
                document.getElementById('totalAttendance').textContent = result.summary.totalAttendance;
                document.getElementById('avgRate').textContent = `${result.summary.avgRate}%`;

                renderTable();
                renderPagination(result.totalPages);
            } catch (error) {
                console.error('Error loading records:', error);
            }
        }

        function renderTable() {
            const tbody = document.getElementById('recordsBody');

            if (records.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="no-data">No records found</td></tr>';
                return;
            }

            tbody.innerHTML = records.map(record => `
                <tr>
                    <td>${formatDate(record.created_at)}</td>
                    <td>${record.course_code}</td>
                    <td><span class="code-badge">${record.session_code}</span></td>
                    <td>${record.session_type || 'Regular'}</td>
                    <td>${record.attendance_count}/${record.expected_students || '-'}</td>
                    <td><span class="rate-badge ${getRateClass(record.attendance_rate)}">${record.attendance_rate}%</span></td>
                    <td><button class="btn btn-sm btn-outline view-detail" data-id="${record.id}">View</button></td>
                </tr>
            `).join('');
        }

        function renderPagination(totalPages) {
            const container = document.getElementById('pagination');
            if (totalPages <= 1) { container.innerHTML = ''; return; }

            let html = '';
            for (let i = 1; i <= totalPages; i++) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
            }
            container.innerHTML = html;
        }

        function changePage(page) {
            currentPage = page;
            loadRecords();
        }

        function setupEventListeners() {
            document.getElementById('applyFilters').addEventListener('click', () => {
                filters = {
                    courseId: document.getElementById('courseFilter').value || null,
                    dateFrom: document.getElementById('dateFrom').value || null,
                    dateTo: document.getElementById('dateTo').value || null
                };
                currentPage = 1;
                loadRecords();
            });

            document.getElementById('clearFilters').addEventListener('click', () => {
                document.getElementById('courseFilter').value = '';
                document.getElementById('dateFrom').value = '';
                document.getElementById('dateTo').value = '';
                filters = { courseId: null, dateFrom: null, dateTo: null };
                currentPage = 1;
                loadRecords();
            });

            document.getElementById('exportCsv').addEventListener('click', async () => {
                const allRecords = await LecturerAPI.getAllAttendanceRecords({ lecturerId: lecturerData.id, ...filters });
                ExportUtils.toCsv(allRecords, 'attendance_records.csv');
            });
        }

        function formatDate(dateStr) {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        function getRateClass(rate) {
            if (rate >= 80) return 'high';
            if (rate >= 60) return 'medium';
            return 'low';
        }
    </script>
</body>
</html>

CSS Styling

main.css (Global Styles)

/* CSS Variables */
:root {
    --primary-color: #1a365d;
    --primary-light: #e8f0fe;
    --primary-dark: #0f2442;
    --secondary-color: #4a5568;
    --success-color: #22c55e;
    --success-light: #dcfce7;
    --warning-color: #f59e0b;
    --warning-light: #fef3c7;
    --error-color: #ef4444;
    --error-light: #fee2e2;
    --info-color: #3b82f6;
    --text-primary: #1a202c;
    --text-secondary: #4a5568;
    --text-muted: #718096;
    --bg-primary: #ffffff;
    --bg-secondary: #f7fafc;
    --bg-tertiary: #edf2f7;
    --border-color: #e2e8f0;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --transition-fast: 150ms ease;
    --transition-normal: 250ms ease;
}

/* Reset & Base Styles */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    font-size: 16px;
    scroll-behavior: smooth;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 1rem;
    line-height: 1.5;
    color: var(--text-primary);
    background-color: var(--bg-secondary);
    min-height: 100vh;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
}

h1 { font-size: 1.875rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }

a {
    color: var(--primary-color);
    text-decoration: none;
}

/* App Header */
.app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    z-index: 100;
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 16px;
    max-width: 1400px;
    margin: 0 auto;
}

.header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.page-title {
    font-size: 1.25rem;
    font-weight: 600;
}

.back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    color: var(--text-secondary);
}

.back-btn svg {
    width: 24px;
    height: 24px;
    stroke-width: 2;
}

/* Main Content */
.main-content {
    margin-top: 60px;
    padding: 24px;
    min-height: calc(100vh - 60px);
}

@media (min-width: 1024px) {
    .main-content {
        margin-left: 260px;
    }
}

/* Side Navigation */
.side-nav {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    width: 260px;
    background: var(--bg-primary);
    border-right: 1px solid var(--border-color);
    overflow-y: auto;
    z-index: 90;
    transform: translateX(-100%);
    transition: transform 250ms ease;
}

.side-nav.open {
    transform: translateX(0);
}

@media (min-width: 1024px) {
    .side-nav {
        transform: translateX(0);
    }
}

.nav-list {
    list-style: none;
    padding: 16px;
}

.nav-item a {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
    color: var(--text-secondary);
    font-weight: 500;
}

.nav-item a:hover {
    background: var(--bg-tertiary);
}

.nav-item.active a {
    background: var(--primary-light);
    color: var(--primary-color);
}

.nav-item svg {
    width: 20px;
    height: 20px;
    stroke-width: 2;
}

/* Login Page */
.login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
}

.login-container {
    width: 100%;
    max-width: 400px;
    padding: 32px;
    background: var(--bg-primary);
    border-radius: 16px;
    box-shadow: var(--shadow-lg);
}

.login-header {
    text-align: center;
    margin-bottom: 32px;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Form Elements */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.form-group label {
    font-weight: 500;
    color: var(--text-secondary);
    font-size: 0.875rem;
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-light);
}

.helper-text {
    color: var(--text-muted);
    font-size: 0.75rem;
}

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 24px;
    font-size: 1rem;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary {
    background: var(--primary-color);
    color: white;
}

.btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
}

.btn-outline {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
}

.btn-success {
    background: var(--success-color);
    color: white;
}

.btn-danger {
    background: var(--error-color);
    color: white;
}

.btn-sm {
    padding: 8px 16px;
    font-size: 0.875rem;
}

.btn-full {
    width: 100%;
}

/* Toast Container */
.toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.toast {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
}

.toast.success { border-left: 4px solid var(--success-color); }
.toast.error { border-left: 4px solid var(--error-color); }
.toast.info { border-left: 4px solid var(--info-color); }

/* Modal */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
}

.modal-content {
    background: var(--bg-primary);
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-lg {
    max-width: 700px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid var(--border-color);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted);
}

.modal-body {
    padding: 24px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 24px;
    border-top: 1px solid var(--border-color);
}

/* Utility Classes */
.hidden {
    display: none !important;
}

components.css (UI Components)

/* Action Cards */
.action-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
}

.action-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: var(--bg-primary);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    text-decoration: none;
    color: var(--text-primary);
}

.action-card.primary { border-left: 4px solid var(--primary-color); }
.action-card.secondary { border-left: 4px solid var(--warning-color); }
.action-card.tertiary { border-left: 4px solid var(--success-color); }

.action-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-icon svg {
    width: 24px;
    height: 24px;
    stroke-width: 2;
}

/* Session Cards */
.session-card {
    background: var(--bg-primary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    padding: 16px;
    margin-bottom: 16px;
    cursor: pointer;
}

.session-card:hover {
    border-color: var(--primary-color);
}

.session-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.session-code {
    font-family: monospace;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--primary-color);
}

.session-details {
    display: flex;
    gap: 24px;
    margin-bottom: 8px;
}

.session-stat .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
}

.session-stat .value {
    font-weight: 600;
}

.session-progress {
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar {
    height: 100%;
    background: var(--primary-color);
    border-radius: 2px;
}

/* Empty States */
.empty-state {
    text-align: center;
    padding: 32px;
    color: var(--text-muted);
}

.empty-state svg {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    stroke-width: 1;
}

/* Stat Cards */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
}

.stat-card {
    background: var(--bg-primary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
}

.stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-icon.sessions { background: var(--primary-light); color: var(--primary-color); }
.stat-icon.attendance { background: var(--success-light); color: var(--success-color); }
.stat-icon.pending { background: var(--warning-light); color: var(--warning-color); }

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
}

/* Form Sections */
.form-section {
    margin-bottom: 32px;
}

.form-section h2 {
    font-size: 1.125rem;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-color);
}

/* Duration Selector */
.duration-selector {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.duration-btn {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
}

.duration-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
}

/* Radio Group */
.radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
}

/* Toggle */
.toggle-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.toggle {
    position: relative;
    width: 48px;
    height: 24px;
}

.toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #d1d5db;
    border-radius: 24px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
    background-color: var(--primary-color);
}

.toggle input:checked + .toggle-slider:before {
    transform: translateX(24px);
}

/* Preview Card */
.preview-card {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 24px;
}

.preview-code {
    text-align: center;
    margin-bottom: 16px;
}

.code-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
    letter-spacing: 4px;
}

.preview-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
}

/* Info Banner */
.info-banner {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: var(--primary-light);
    border-radius: 8px;
    margin-bottom: 24px;
}

.info-banner.warning {
    background: var(--warning-light);
}

.info-banner svg {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
}

/* Pending Cards */
.pending-card {
    background: var(--bg-primary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    padding: 24px;
    margin-bottom: 16px;
}

.pending-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.student-info {
    display: flex;
    align-items: center;
    gap: 16px;
}

.student-info .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: var(--primary-color);
}

.pending-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

.time-badge {
    font-size: 0.75rem;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    padding: 4px 8px;
    border-radius: 4px;
}

/* Tables */
.records-table-container {
    background: var(--bg-primary);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    overflow: hidden;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid var(--border-color);
}

.records-table {
    width: 100%;
    border-collapse: collapse;
}

.records-table th,
.records-table td {
    padding: 16px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.records-table th {
    background: var(--bg-tertiary);
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-muted);
    text-transform: uppercase;
}

.code-badge {
    font-family: monospace;
    background: var(--primary-light);
    color: var(--primary-color);
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
}

.rate-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}

.rate-badge.high { background: var(--success-light); color: var(--success-color); }
.rate-badge.medium { background: var(--warning-light); color: var(--warning-color); }
.rate-badge.low { background: var(--error-light); color: var(--error-color); }

/* Summary Cards */
.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.summary-card {
    background: var(--bg-primary);
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    border: 1px solid var(--border-color);
}

.summary-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
}

.summary-label {
    font-size: 0.875rem;
    color: var(--text-muted);
}

/* Filters */
.filters-section {
    background: var(--bg-primary);
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
}

.filter-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: flex-end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.filter-group input,
.filter-group select {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
}

/* Live Session Styles */
.live-session-container {
    max-width: 800px;
    margin: 0 auto;
}

.session-header-card {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    border-radius: 16px;
    padding: 24px;
    color: white;
    margin-bottom: 24px;
}

.session-code-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.session-code-display .code {
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: 4px;
}

.session-meta {
    display: flex;
    gap: 24px;
}

.meta-item .label {
    font-size: 0.75rem;
    opacity: 0.8;
    text-transform: uppercase;
}

.meta-item .value {
    font-size: 1.25rem;
    font-weight: 600;
}

.timer-section {
    text-align: center;
    margin-bottom: 24px;
}

.timer-display {
    font-size: 4rem;
    font-weight: 700;
}

.timer-display.warning {
    color: var(--warning-color);
}

.timer-display.critical {
    color: var(--error-color);
}

.qr-section {
    background: white;
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    margin-bottom: 24px;
}

.qr-code {
    width: 200px;
    height: 200px;
    margin: 0 auto 16px;
}

.attendance-feed {
    background: white;
    border-radius: 16px;
    padding: 24px;
}

.feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.feed-count {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
}

.feed-list {
    max-height: 400px;
    overflow-y: auto;
}

.feed-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
}

.feed-item .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-weight: 600;
    color: var(--primary-color);
}

.feed-item .info {
    flex: 1;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
}

.status-badge.verified { background: var(--success-light); color: var(--success-color); }
.status-badge.pending { background: var(--warning-light); color: var(--warning-color); }

.session-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 24px;
}

/* User Menu */
.user-menu {
    position: relative;
}

.user-avatar {
    width: 36px;
    height: 36px;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

.dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 200px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
}

.dropdown-header {
    padding: 16px;
}

.dropdown-item {
    display: block;
    width: 100%;
    padding: 16px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    color: var(--text-secondary);
}

.dropdown-item:hover {
    background: var(--bg-tertiary);
}

/* Notification Badge */
.notification-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 18px;
    height: 18px;
    background: var(--error-color);
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Search Results */
.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
}

.search-result-item {
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
}

.search-result-item:hover {
    background: var(--bg-tertiary);
}

.selected-student {
    margin-top: 16px;
}

.student-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: 8px;
}

JavaScript Modules

app.js (Main Application Logic)

// Lecturer Authentication
const LecturerAuth = {
    async loginLecturer(staffId, password, initials) {
        try {
            const { data, error } = await supabase
                .from('lecturers')
                .select('*')
                .eq('staff_id', staffId)
                .single();

            if (error || !data) {
                return { success: false, error: 'Invalid credentials' };
            }

            // Verify password (using Supabase Auth or custom verification)
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: password
            });

            if (authError) {
                return { success: false, error: 'Invalid credentials' };
            }

            // Check if initials are set
            if (!data.initials) {
                return {
                    success: true,
                    needsInitialsConfirmation: true,
                    session: { lecturer: data, session: authData }
                };
            }

            // Store session
            localStorage.setItem('lecturerSession', JSON.stringify({
                id: data.id,
                staff_id: data.staff_id,
                full_name: data.full_name,
                initials: data.initials,
                email: data.email
            }));

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'An error occurred' };
        }
    },

    async getCurrentLecturer() {
        const session = localStorage.getItem('lecturerSession');
        return session ? JSON.parse(session) : null;
    },

    async confirmInitials(lecturerId, initials, tempSession) {
        try {
            const { error } = await supabase
                .from('lecturers')
                .update({ initials: initials.toUpperCase() })
                .eq('id', lecturerId);

            if (error) {
                return { success: false, error: 'Failed to save initials' };
            }

            // Store session
            localStorage.setItem('lecturerSession', JSON.stringify({
                id: tempSession.lecturer.id,
                staff_id: tempSession.lecturer.staff_id,
                full_name: tempSession.lecturer.full_name,
                initials: initials.toUpperCase(),
                email: tempSession.lecturer.email
            }));

            return { success: true };
        } catch (error) {
            console.error('Initials confirmation error:', error);
            return { success: false, error: 'An error occurred' };
        }
    },

    async signOut() {
        await supabase.auth.signOut();
        localStorage.removeItem('lecturerSession');
    }
};

// Lecturer API
const LecturerAPI = {
    async getMyCourses(lecturerId) {
        const { data, error } = await supabase
            .from('course_lecturers')
            .select(`
                course_id,
                courses (
                    id,
                    code,
                    name,
                    enrollments(count)
                )
            `)
            .eq('lecturer_id', lecturerId);

        if (error) return [];

        return data.map(item => ({
            id: item.courses.id,
            code: item.courses.code,
            name: item.courses.name,
            enrolled_count: item.courses.enrollments[0]?.count || 0
        }));
    },

    async getTodaySchedule(lecturerId) {
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        const { data, error } = await supabase
            .from('course_schedules')
            .select(`
                *,
                courses!inner(
                    id,
                    code,
                    name,
                    course_lecturers!inner(lecturer_id)
                ),
                rooms(name)
            `)
            .eq('courses.course_lecturers.lecturer_id', lecturerId)
            .eq('day_of_week', dayOfWeek);

        if (error) return [];
        return data || [];
    },

    async getWeeklyStats(lecturerId) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: sessions, error } = await supabase
            .from('attendance_sessions')
            .select('id, attendance_logs(count)')
            .eq('lecturer_id', lecturerId)
            .gte('created_at', oneWeekAgo.toISOString());

        if (error) return { totalSessions: 0, totalAttendance: 0, avgAttendanceRate: 0 };

        const totalSessions = sessions.length;
        const totalAttendance = sessions.reduce((sum, s) => sum + (s.attendance_logs?.[0]?.count || 0), 0);

        return {
            totalSessions,
            totalAttendance,
            avgAttendanceRate: totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0
        };
    },

    async checkInitialsTaken(initials, excludeLecturerId) {
        const { data, error } = await supabase
            .from('lecturers')
            .select('id')
            .eq('initials', initials)
            .neq('id', excludeLecturerId)
            .limit(1);

        return data && data.length > 0;
    },

    async getAttendanceRecords({ lecturerId, courseId, dateFrom, dateTo, page, pageSize }) {
        let query = supabase
            .from('attendance_sessions')
            .select(`
                id,
                session_code,
                created_at,
                session_type,
                courses(code, name),
                rooms(name),
                attendance_logs(count)
            `, { count: 'exact' })
            .eq('lecturer_id', lecturerId)
            .order('created_at', { ascending: false });

        if (courseId) {
            query = query.eq('course_id', courseId);
        }
        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) return { records: [], summary: {}, totalPages: 0 };

        const records = data.map(s => ({
            id: s.id,
            session_code: s.session_code,
            created_at: s.created_at,
            session_type: s.session_type,
            course_code: s.courses?.code,
            course_name: s.courses?.name,
            room_name: s.rooms?.name,
            attendance_count: s.attendance_logs?.[0]?.count || 0,
            attendance_rate: 0
        }));

        return {
            records,
            summary: {
                totalSessions: count,
                totalAttendance: records.reduce((sum, r) => sum + r.attendance_count, 0),
                avgAttendanceRate: 75
            },
            totalPages: Math.ceil(count / pageSize)
        };
    }
};

// Toast Notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

session-manager.js

const SessionAPI = {
    async createSession({ courseId, roomId, duration, sessionType, gpsRequired }) {
        const lecturer = await LecturerAuth.getCurrentLecturer();
        if (!lecturer) return { success: false, error: 'Not authenticated' };

        // Generate unique session code
        const sessionCode = await this.generateUniqueCode(lecturer.initials);

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + duration);

        const { data, error } = await supabase
            .from('attendance_sessions')
            .insert({
                course_id: courseId,
                lecturer_id: lecturer.id,
                room_id: roomId,
                session_code: sessionCode,
                expires_at: expiresAt.toISOString(),
                session_type: sessionType || 'regular',
                gps_required: gpsRequired,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: 'Failed to create session' };
        }

        return { success: true, session: data };
    },

    async generateUniqueCode(initials) {
        let code;
        let exists = true;

        while (exists) {
            const random = Math.floor(1000 + Math.random() * 9000);
            code = initials.toUpperCase() + random;

            const { data } = await supabase
                .from('attendance_sessions')
                .select('id')
                .eq('session_code', code)
                .limit(1);

            exists = data && data.length > 0;
        }

        return code;
    },

    async getLecturerActiveSessions(lecturerId) {
        const { data, error } = await supabase
            .from('attendance_sessions')
            .select(`
                id,
                session_code,
                expires_at,
                created_at,
                courses(code, name),
                rooms(name, building),
                attendance_logs(count)
            `)
            .eq('lecturer_id', lecturerId)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) return [];

        return data.map(s => ({
            id: s.id,
            session_code: s.session_code,
            expires_at: s.expires_at,
            course_code: s.courses?.code,
            course_name: s.courses?.name,
            room_name: s.rooms?.name,
            attendance_count: s.attendance_logs?.[0]?.count || 0
        }));
    },

    async getSessionById(sessionId) {
        const { data, error } = await supabase
            .from('attendance_sessions')
            .select(`
                *,
                courses(code, name),
                rooms(name, building)
            `)
            .eq('id', sessionId)
            .single();

        if (error) return null;

        return {
            ...data,
            course_code: data.courses?.code,
            room_name: data.rooms?.name
        };
    },

    async getSessionAttendance(sessionId) {
        const { data, error } = await supabase
            .from('attendance_logs')
            .select(`
                id,
                check_in_time,
                status,
                students(full_name, matric_number)
            `)
            .eq('session_id', sessionId)
            .order('check_in_time', { ascending: false });

        if (error) return [];

        return data.map(log => ({
            id: log.id,
            check_in_time: log.check_in_time,
            status: log.status,
            student_name: log.students?.full_name,
            matric_number: log.students?.matric_number
        }));
    },

    async extendSession(sessionId, additionalMinutes) {
        // First get current expiry
        const session = await this.getSessionById(sessionId);
        if (!session) return { success: false };

        const newExpiry = new Date(session.expires_at);
        newExpiry.setMinutes(newExpiry.getMinutes() + additionalMinutes);

        const { error } = await supabase
            .from('attendance_sessions')
            .update({ expires_at: newExpiry.toISOString() })
            .eq('id', sessionId);

        return { success: !error };
    },

    async endSession(sessionId) {
        const { error } = await supabase
            .from('attendance_sessions')
            .update({
                status: 'ended',
                ended_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        return { success: !error };
    },

    async quickCreate(courseId, roomId) {
        return this.createSession({
            courseId,
            roomId,
            duration: 10,
            gpsRequired: true
        });
    }
};

realtime.js

const RealtimeManager = {
    subscriptions: [],

    async subscribeToSession(sessionId, callbacks) {
        const channel = supabase
            .channel(`session:${sessionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'attendance_logs',
                filter: `session_id=eq.${sessionId}`
            }, (payload) => {
                if (callbacks.onNewAttendance) {
                    callbacks.onNewAttendance(payload.new);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'attendance_sessions',
                filter: `id=eq.${sessionId}`
            }, (payload) => {
                if (callbacks.onSessionUpdate) {
                    callbacks.onSessionUpdate(payload.new);
                }
            })
            .subscribe();

        this.subscriptions.push(channel);
        return channel;
    },

    async subscribeToLecturerUpdates(lecturerId, callbacks) {
        const channel = supabase
            .channel(`lecturer:${lecturerId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'attendance_logs',
                filter: `lecturer_id=eq.${lecturerId}`
            }, (payload) => {
                if (callbacks.onAttendanceUpdate) {
                    callbacks.onAttendanceUpdate(payload.new);
                }
            })
            .subscribe();

        this.subscriptions.push(channel);
        return channel;
    },

    async subscribeToPendingApprovals(lecturerId, callback) {
        const channel = supabase
            .channel(`pending:${lecturerId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'device_mismatch_approvals',
                filter: `lecturer_id=eq.${lecturerId}`
            }, (payload) => {
                callback(payload.new);
            })
            .subscribe();

        this.subscriptions.push(channel);
        return channel;
    },

    unsubscribeAll() {
        this.subscriptions.forEach(sub => {
            supabase.removeChannel(sub);
        });
        this.subscriptions = [];
    }
};

Real-time Features

The Lecturer App uses Supabase Realtime for:

- Live Attendance Updates: When students check in, the attendance feed updates instantly without page refresh.

- Session Monitoring: Real-time countdown timer and session status updates.

- Pending Approval Notifications: Instant notifications when students require device mismatch approval.

- Multi-device Sync: Lecturers can monitor sessions from multiple devices simultaneously.

Realtime Implementation Pattern

// Subscribe to session attendance updates
const subscription = await RealtimeManager.subscribeToSession(sessionId, {
    onNewAttendance: (data) => {
        // Update UI with new attendance record
        addAttendanceItemToFeed(data);
        updateAttendanceCount();
    },
    onSessionUpdate: (data) => {
        // Handle session status changes
        if (data.status === 'ended') {
            handleSessionEnd();
        }
    }
});

// Cleanup when leaving page
window.addEventListener('beforeunload', () => {
    subscription.unsubscribe();
});

Security Considerations

1. Authentication Flow

- Lecturers authenticate using staff ID and password

- Session stored in localStorage for persistence

- Token refresh handled automatically by Supabase

2. Initials Protection

- Initials are unique across the system

- Once set, cannot be changed without admin approval

- Stamped on all session codes for accountability

3. Session Code Security

- Codes auto-expire after configured duration

- Each code is unique (verified before creation)

- Pattern: [LECTURER_INITIALS][RANDOM_4_DIGITS]

4. Device Mismatch Handling

- Students flagged for device mismatch appear in pending queue

- Lecturer can view device comparison before approval

- All approval actions are logged for audit

5. Manual Attendance Audit Trail

- Every manual addition requires a reason

- Lecturer ID, timestamp, and reason recorded

- Visible in audit logs for administrators

6. RLS Policy Enforcement

- Lecturers can only access their own courses

- Session data restricted to assigned courses

- Attendance records filtered by lecturer association