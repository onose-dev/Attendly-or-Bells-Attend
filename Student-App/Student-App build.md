Student Application - Complete Build Documentation

Table of Contents

- Overview

- Project Structure

- HTML Pages

- CSS Styling

- JavaScript Modules

- Screen-by-Screen Implementation

- Device Binding with FingerprintJS

- GPS Validation Implementation

- Realtime Subscriptions

- Error Handling

- Security Considerations

Overview

The Student Application is a Progressive Web App (PWA) designed for students to check in to attendance sessions, view their attendance history, and receive real-time notifications when sessions start. The application is built with vanilla HTML, CSS, and JavaScript, utilizing Supabase for backend services.

Key Features

- Authentication: Simple login using matric number and name verification

- Onboarding: Academic profile setup and course selection

- Device Binding: Secure device registration using FingerprintJS

- Real-time Check-in: Submit attendance with GPS and device validation

- Attendance History: View detailed attendance records per course

- Notifications: Real-time alerts for session starts and approval updates

Technology Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6+)

- Backend: Supabase (PostgreSQL, Auth, Realtime)

- Security: FingerprintJS for device identification

- PWA: Service Worker, Web App Manifest

Project Structure

student-app/
├── index.html              # Login page (Screen 1)
├── onboarding.html         # Onboarding flow (Screen 2)
├── dashboard.html          # Main dashboard (Screen 3)
├── check-in.html           # Check-in modal page (Screen 4)
├── attendance-log.html     # Attendance history (Screen 5)
├── notifications.html      # Notification center (Screen 6)
├── css/
│   ├── main.css           # Global styles
│   ├── components.css     # Reusable UI components
│   ├── screens.css        # Screen-specific styles
│   └── utilities.css      # Utility classes
├── js/
│   ├── app.js             # Main application logic
│   ├── auth.js            # Authentication module
│   ├── api.js             # Supabase API wrapper
│   ├── fingerprint.js     # FingerprintJS integration
│   ├── gps.js             # Geolocation utilities
│   ├── notifications.js   # Push notification handling
│   ├── realtime.js        # Supabase Realtime subscriptions
│   └── utils.js           # Utility functions
├── assets/
│   ├── images/            # Static images
│   ├── icons/             # App icons
│   └── fonts/             # Custom fonts
├── sw.js                  # Service Worker
└── manifest.json          # PWA Manifest

HTML Pages

Screen 1: Login Page (index.html)

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#1e40af">
    <meta name="description" content="Bells University Attendance Management System">

    <!-- PWA Meta Tags -->
    <link rel="manifest" href="manifest.json">
    <link rel="apple-touch-icon" href="assets/icons/icon-192.png">

    <!-- Stylesheets -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/screens.css">

    <title>Attendly - Student Login</title>
</head>
<body class="login-screen">
    <div class="login-container">
        <!-- University Branding Section -->
        <div class="branding-section">
            <div class="logo-container">
                <img src="assets/images/bells-crest.png" alt="Bells University Crest" class="university-logo">
            </div>
            <h1 class="university-name">Bells University of Technology</h1>
            <p class="app-tagline">Attendance Management System</p>
        </div>

        <!-- Login Form Section -->
        <div class="login-form-section">
            <form id="loginForm" class="login-form" autocomplete="off">
                <h2 class="form-title">Student Sign In</h2>

                <!-- Full Name Input -->
                <div class="input-group">
                    <label for="fullName" class="input-label">Full Name</label>
                    <div class="input-wrapper">
                        <span class="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </span>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            class="input-field"
                            placeholder="Enter your full name"
                            required
                            autocomplete="name"
                        >
                    </div>
                    <span class="input-error" id="fullNameError"></span>
                </div>

                <!-- Matric Number Input -->
                <div class="input-group">
                    <label for="matricNumber" class="input-label">Matric Number</label>
                    <div class="input-wrapper">
                        <span class="input-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </span>
                        <input
                            type="text"
                            id="matricNumber"
                            name="matricNumber"
                            class="input-field"
                            placeholder="e.g., 2023/1234"
                            required
                            autocomplete="off"
                            style="text-transform: uppercase;"
                        >
                    </div>
                    <span class="input-error" id="matricNumberError"></span>
                </div>

                <!-- Submit Button -->
                <button type="submit" class="btn btn-primary btn-full" id="loginBtn">
                    <span class="btn-text">Sign In</span>
                    <span class="btn-loader hidden">
                        <svg class="spinner" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                        </svg>
                    </span>
                </button>
            </form>

            <!-- Help Link -->
            <div class="help-section">
                <button type="button" class="help-link" id="helpBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    Need Help?
                </button>
            </div>
        </div>
    </div>

    <!-- Help Modal -->
    <div class="modal" id="helpModal">
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Need Help?</h3>
                <button class="modal-close" id="closeHelpModal">&amp;times;</button>
            </div>
            <div class="modal-body">
                <p>If you're having trouble signing in, please contact:</p>
                <div class="contact-info">
                    <p><strong>Admin Office</strong></p>
                    <p>Email: attendance@bellsuniversity.edu.ng</p>
                    <p>Phone: +234 123 456 7890</p>
                </div>
                <div class="help-tips">
                    <h4>Tips:</h4>
                    <ul>
                        <li>Ensure your matric number is in the correct format (e.g., 2023/1234)</li>
                        <li>Use the same name you registered with</li>
                        <li>Contact admin if you're a new student</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/app.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/screens/login.js"></script>
</body>
</html>

Screen 2: Onboarding Page (onboarding.html)

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#1e40af">

    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/screens.css">

    <title>Complete Your Profile - Attendly</title>
</head>
<body class="onboarding-screen">
    <!-- Progress Indicator -->
    <div class="onboarding-progress">
        <div class="progress-steps">
            <div class="step active" data-step="1">
                <span class="step-number">1</span>
                <span class="step-label">Academic</span>
            </div>
            <div class="step" data-step="2">
                <span class="step-number">2</span>
                <span class="step-label">Courses</span>
            </div>
            <div class="step" data-step="3">
                <span class="step-number">3</span>
                <span class="step-label">Security</span>
            </div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 33.33%"></div>
        </div>
    </div>

    <div class="onboarding-container">
        <!-- Step 1: Academic Profile -->
        <div class="onboarding-step active" id="step1">
            <div class="step-header">
                <h2 class="step-title">Academic Profile</h2>
                <p class="step-description">Tell us about your academic details</p>
            </div>

            <form id="academicForm" class="onboarding-form">
                <!-- College Selection -->
                <div class="input-group">
                    <label for="college" class="input-label">College</label>
                    <div class="select-wrapper">
                        <select id="college" name="college" class="select-field" required>
                            <option value="">Select your college</option>
                            <!-- Options populated dynamically -->
                        </select>
                        <span class="select-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </span>
                    </div>
                </div>

                <!-- Department Selection -->
                <div class="input-group">
                    <label for="department" class="input-label">Department</label>
                    <div class="select-wrapper">
                        <select id="department" name="department" class="select-field" required disabled>
                            <option value="">Select your department</option>
                        </select>
                        <span class="select-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </span>
                    </div>
                </div>

                <!-- Level Selection -->
                <div class="input-group">
                    <label for="level" class="input-label">Level</label>
                    <div class="select-wrapper">
                        <select id="level" name="level" class="select-field" required>
                            <option value="">Select your level</option>
                            <option value="100">100 Level</option>
                            <option value="200">200 Level</option>
                            <option value="300">300 Level</option>
                            <option value="400">400 Level</option>
                            <option value="500">500 Level</option>
                            <option value="600">600 Level</option>
                            <option value="700">700 Level</option>
                        </select>
                        <span class="select-arrow">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </span>
                    </div>
                </div>

                <div class="step-actions">
                    <button type="submit" class="btn btn-primary btn-full">
                        Continue
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                    </button>
                </div>
            </form>
        </div>

        <!-- Step 2: Course Selection -->
        <div class="onboarding-step" id="step2">
            <div class="step-header">
                <h2 class="step-title">Course Selection</h2>
                <p class="step-description">Select the courses you're enrolled in</p>
            </div>

            <div class="course-selection-container">
                <!-- Search Bar -->
                <div class="search-bar">
                    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        id="courseSearch"
                        class="search-input"
                        placeholder="Search courses..."
                    >
                </div>

                <!-- Course Categories -->
                <div class="course-categories">
                    <button class="category-btn active" data-category="all">All</button>
                    <button class="category-btn" data-category="regular">Regular</button>
                    <button class="category-btn" data-category="carryover">Carryover</button>
                    <button class="category-btn" data-category="elective">Elective</button>
                </div>

                <!-- Standard Courses (Auto-filtered by Level) -->
                <div class="course-section">
                    <h3 class="section-title">Standard Courses for Your Level</h3>
                    <div class="course-list" id="standardCourses">
                        <!-- Populated dynamically -->
                    </div>
                </div>

                <!-- Selected Courses Summary -->
                <div class="selected-courses" id="selectedCoursesSection">
                    <h3 class="section-title">
                        Selected Courses
                        <span class="count" id="selectedCount">0</span>
                    </h3>
                    <div class="selected-list" id="selectedList">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>

            <div class="step-actions">
                <button type="button" class="btn btn-secondary" id="backToStep1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                    Back
                </button>
                <button type="button" class="btn btn-primary" id="toStep3">
                    Continue
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Step 3: Device Binding -->
        <div class="onboarding-step" id="step3">
            <div class="step-header">
                <h2 class="step-title">Secure Your Device</h2>
                <p class="step-description">Bind this device to your account for secure attendance</p>
            </div>

            <div class="device-binding-container">
                <!-- Animation -->
                <div class="security-animation" id="securityAnimation">
                    <div class="scan-circle">
                        <div class="scan-ring ring-1"></div>
                        <div class="scan-ring ring-2"></div>
                        <div class="scan-ring ring-3"></div>
                        <div class="scan-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                <path d="M9 12l2 2 4-4"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Info Box -->
                <div class="info-box">
                    <h4>Why do we need this?</h4>
                    <ul>
                        <li>Prevents others from checking in on your behalf</li>
                        <li>Ensures attendance integrity</li>
                        <li>Protects your academic record</li>
                    </ul>
                </div>

                <!-- Device Info Preview -->
                <div class="device-preview hidden" id="devicePreview">
                    <h4>Device Detected</h4>
                    <div class="device-details">
                        <div class="detail-row">
                            <span class="label">Device:</span>
                            <span class="value" id="deviceName">-</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Browser:</span>
                            <span class="value" id="deviceBrowser">-</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">OS:</span>
                            <span class="value" id="deviceOS">-</span>
                        </div>
                    </div>
                </div>

                <!-- Status Message -->
                <div class="binding-status" id="bindingStatus">
                    <p class="status-text">Click the button below to secure your device</p>
                </div>

                <div class="step-actions">
                    <button type="button" class="btn btn-secondary" id="backToStep2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15,18 9,12 15,6"></polyline>
                        </svg>
                        Back
                    </button>
                    <button type="button" class="btn btn-primary btn-lg" id="bindDeviceBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        Secure My Device
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://openfpcdn.io/fingerprintjs/v4"></script>
    <script src="js/app.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/fingerprint.js"></script>
    <script src="js/screens/onboarding.js"></script>
</body>
</html>

Screen 3: Dashboard (dashboard.html)

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#1e40af">

    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/screens.css">

    <title>Dashboard - Attendly</title>
</head>
<body class="dashboard-screen">
    <!-- Top Header -->
    <header class="dashboard-header">
        <div class="header-left">
            <div class="profile-avatar" id="profileAvatar">
                <span class="avatar-initials" id="avatarInitials">JD</span>
            </div>
            <div class="user-info">
                <h2 class="user-name" id="userName">John Doe</h2>
                <p class="user-matric" id="userMatric">2023/1234</p>
            </div>
        </div>
        <div class="header-right">
            <button class="notification-btn" id="notificationBtn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="notification-badge hidden" id="notificationBadge">0</span>
            </button>
            <button class="menu-btn" id="menuBtn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
        </div>
    </header>

    <main class="dashboard-content">
        <!-- Active Session Banner -->
        <div class="active-session-banner hidden" id="activeSessionBanner">
            <div class="banner-pulse"></div>
            <div class="banner-content">
                <div class="session-info">
                    <span class="live-badge">LIVE</span>
                    <span class="session-course" id="activeCourse">MTH 202</span>
                    <span class="session-room" id="activeRoom">LT2</span>
                </div>
                <div class="session-timer">
                    <span id="sessionTimer">14:22</span>
                    <span class="timer-label">remaining</span>
                </div>
            </div>
            <button class="btn btn-primary btn-checkin" id="checkInBtn">
                Check-In Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
            </button>
        </div>

        <!-- Course Grid Section -->
        <section class="courses-section">
            <div class="section-header">
                <h3 class="section-title">My Courses</h3>
                <button class="btn btn-text" id="viewAllCourses">View All</button>
            </div>

            <div class="course-grid" id="courseGrid">
                <!-- Course cards populated dynamically -->

                <!-- Sample Course Card Template -->
                <div class="course-card" data-course-id="">
                    <div class="card-header">
                        <div class="progress-ring">
                            <svg viewBox="0 0 36 36">
                                <path class="ring-bg"
                                    d="M18 2.0845
                                       a 15.9155 15.9155 0 0 1 0 31.831
                                       a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="#eee" stroke-width="3"/>
                                <path class="ring-progress"
                                    d="M18 2.0845
                                       a 15.9155 15.9155 0 0 1 0 31.831
                                       a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="#10B981" stroke-width="3"
                                    stroke-dasharray="75, 100"/>
                            </svg>
                            <span class="progress-value">75%</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <h4 class="course-code">MTH 202</h4>
                        <p class="course-name">Linear Algebra</p>
                        <div class="lecturer-badges">
                            <span class="badge" title="Dr. Arekhanose Daniel">AD</span>
                            <span class="badge badge-secondary" title="Dr. Ojo Oluwaseun">OO</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-text view-log-btn" data-course-id="">
                            View Log
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Quick Stats Section -->
        <section class="stats-section">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <span class="stat-value" id="totalPresent">45</span>
                        <span class="stat-label">Sessions Attended</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <span class="stat-value" id="totalAbsent">5</span>
                        <span class="stat-label">Sessions Missed</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22,4 12,14.01 9,11.01"></polyline>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <span class="stat-value" id="avgAttendance">90%</span>
                        <span class="stat-label">Avg Attendance</span>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Side Menu -->
    <div class="side-menu" id="sideMenu">
        <div class="menu-overlay" id="menuOverlay"></div>
        <div class="menu-content">
            <div class="menu-header">
                <div class="profile-summary">
                    <div class="profile-avatar large">
                        <span class="avatar-initials">JD</span>
                    </div>
                    <div class="profile-details">
                        <h3 id="menuUserName">John Doe</h3>
                        <p id="menuUserMatric">2023/1234</p>
                    </div>
                </div>
            </div>
            <nav class="menu-nav">
                <a href="dashboard.html" class="nav-item active">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9,22 9,12 15,12 15,22"></polyline>
                    </svg>
                    Dashboard
                </a>
                <a href="notifications.html" class="nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    Notifications
                    <span class="nav-badge" id="menuNotificationBadge">3</span>
                </a>
                <a href="#" class="nav-item" id="viewProfileBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    My Profile
                </a>
                <a href="#" class="nav-item" id="myDeviceBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                    My Device
                </a>
                <a href="#" class="nav-item danger" id="logoutBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Sign Out
                </a>
            </nav>
        </div>
    </div>

    <!-- Profile Modal -->
    <div class="modal" id="profileModal">
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">My Profile</h3>
                <button class="modal-close">&amp;times;</button>
            </div>
            <div class="modal-body">
                <div class="profile-info">
                    <div class="info-row">
                        <span class="info-label">Full Name</span>
                        <span class="info-value" id="profileName">John Doe</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Matric Number</span>
                        <span class="info-value" id="profileMatric">2023/1234</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">College</span>
                        <span class="info-value" id="profileCollege">College of Natural Sciences</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Department</span>
                        <span class="info-value" id="profileDepartment">Computer Science</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Level</span>
                        <span class="info-value" id="profileLevel">200 Level</span>
                    </div>
                </div>
                <div class="device-info-section">
                    <h4>Registered Device</h4>
                    <div class="device-info" id="profileDevice">
                        <div class="device-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                            </svg>
                        </div>
                        <div class="device-details">
                            <span class="device-name" id="profileDeviceName">iPhone 14 Pro</span>
                            <span class="device-status verified">Verified</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://openfpcdn.io/fingerprintjs/v4"></script>
    <script src="js/app.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/api.js"></script>
    <script src="js/realtime.js"></script>
    <script src="js/screens/dashboard.js"></script>
</body>
</html>

Screen 4: Check-In Modal (check-in.html)

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#1e40af">

    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/screens.css">

    <title>Check-In - Attendly</title>
</head>
<body class="checkin-screen">
    <div class="checkin-overlay">
        <div class="checkin-container">
            <!-- Header -->
            <div class="checkin-header">
                <button class="back-btn" id="backBtn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                </button>
                <h2 class="checkin-title">Check-In</h2>
                <div class="session-badge" id="sessionBadge">
                    <span class="course-code">MTH 202</span>
                    <span class="room">LT2</span>
                </div>
            </div>

            <!-- Session Info -->
            <div class="session-info-bar">
                <div class="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <span id="timeRemaining">15:00</span>
                </div>
                <div class="info-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span id="roomName">Lecture Theatre 2</span>
                </div>
            </div>

            <!-- Code Input -->
            <div class="code-input-section">
                <p class="input-instruction">Enter the 6-digit room code displayed by your lecturer</p>

                <div class="code-input-container" id="codeInputContainer">
                    <input type="text" maxlength="1" class="code-digit" data-index="0" inputmode="numeric" pattern="[0-9]">
                    <input type="text" maxlength="1" class="code-digit" data-index="1" inputmode="numeric" pattern="[0-9]">
                    <input type="text" maxlength="1" class="code-digit" data-index="2" inputmode="numeric" pattern="[0-9]">
                    <input type="text" maxlength="1" class="code-digit" data-index="3" inputmode="numeric" pattern="[0-9]">
                    <input type="text" maxlength="1" class="code-digit" data-index="4" inputmode="numeric" pattern="[0-9]">
                    <input type="text" maxlength="1" class="code-digit" data-index="5" inputmode="numeric" pattern="[0-9]">
                </div>

                <input type="hidden" id="sessionCodeInput">
            </div>

            <!-- Validation Status Tickers -->
            <div class="validation-tickers">
                <div class="ticker" id="gpsTicker">
                    <div class="ticker-icon pending">
                        <svg class="icon-pending" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        <svg class="icon-check hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <svg class="icon-x hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <div class="ticker-info">
                        <span class="ticker-label">GPS Location</span>
                        <span class="ticker-status" id="gpsStatus">Checking...</span>
                    </div>
                </div>

                <div class="ticker" id="deviceTicker">
                    <div class="ticker-icon pending">
                        <svg class="icon-pending" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        <svg class="icon-check hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        <svg class="icon-x hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <div class="ticker-info">
                        <span class="ticker-label">Device Verification</span>
                        <span class="ticker-status" id="deviceStatus">Checking...</span>
                    </div>
                </div>
            </div>

            <!-- Submit Button -->
            <button class="btn btn-primary btn-full btn-lg" id="submitBtn" disabled>
                <span class="btn-text">Submit Attendance</span>
                <span class="btn-loader hidden">
                    <svg class="spinner" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                    </svg>
                </span>
            </button>

            <!-- Error Message -->
            <div class="error-message hidden" id="errorMessage">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="errorText"></span>
            </div>
        </div>
    </div>

    <!-- Success Modal -->
    <div class="modal success-modal hidden" id="successModal">
        <div class="modal-content centered">
            <div class="success-animation">
                <svg class="checkmark" viewBox="0 0 52 52">
                    <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
            </div>
            <h2 class="success-title">Attendance Submitted!</h2>
            <p class="success-message">Your attendance has been recorded successfully.</p>
            <div class="success-details">
                <span class="course">MTH 202</span>
                <span class="time">10:30 AM</span>
            </div>
            <button class="btn btn-primary" id="doneBtn">Done</button>
        </div>
    </div>

    <!-- Pending Approval Modal -->
    <div class="modal pending-modal hidden" id="pendingModal">
        <div class="modal-content centered">
            <div class="pending-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <h2 class="pending-title">Awaiting Approval</h2>
            <p class="pending-message">Your device does not match your registered device. Your check-in has been sent to the lecturer for approval.</p>
            <div class="pending-info">
                <p><strong>What happens next?</strong></p>
                <ul>
                    <li>The lecturer will review your request</li>
                    <li>You'll be notified when approved</li>
                    <li>If approved, your device will be updated</li>
                </ul>
            </div>
            <button class="btn btn-primary" id="pendingDoneBtn">Got It</button>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="https://openfpcdn.io/fingerprintjs/v4"></script>
    <script src="js/app.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/api.js"></script>
    <script src="js/fingerprint.js"></script>
    <script src="js/gps.js"></script>
    <script src="js/screens/checkin.js"></script>
</body>
</html>

Screen 5: Attendance Log (attendance-log.html)

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#1e40af">

    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/screens.css">

    <title>Attendance Log - Attendly</title>
</head>
<body class="attendance-log-screen">
    <!-- Header -->
    <header class="log-header">
        <button class="back-btn" id="backBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
        </button>
        <div class="header-info">
            <h2 class="course-name" id="courseName">MTH 202 - Linear Algebra</h2>
            <div class="attendance-summary">
                <div class="progress-bar-mini">
                    <div class="progress" id="attendanceProgress" style="width: 75%"></div>
                </div>
                <span class="percentage" id="attendancePercentage">75%</span>
            </div>
        </div>
    </header>

    <main class="log-content">
        <!-- Stats Cards -->
        <div class="log-stats">
            <div class="stat-item">
                <span class="stat-value" id="presentCount">15</span>
                <span class="stat-label">Present</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="absentCount">3</span>
                <span class="stat-label">Absent</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="excusedCount">2</span>
                <span class="stat-label">No Class</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="totalCount">20</span>
                <span class="stat-label">Total</span>
            </div>
        </div>

        <!-- Timeline -->
        <div class="timeline-container" id="timelineContainer">
            <h3 class="timeline-title">Attendance History</h3>

            <div class="timeline" id="attendanceTimeline">
                <!-- Timeline items populated dynamically -->

                <!-- Sample Timeline Item -->
                <div class="timeline-item present">
                    <div class="timeline-marker">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    </div>
                    <div class="timeline-content">
                        <div class="date-row">
                            <span class="date">Mon, Jan 15, 2024</span>
                            <span class="time">10:00 AM</span>
                        </div>
                        <div class="details">
                            <span class="room">LT2</span>
                            <span class="initials">[AD]</span>
                        </div>
                        <span class="status-badge present">Verified</span>
                    </div>
                </div>

                <div class="timeline-item absent">
                    <div class="timeline-marker">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <div class="timeline-content">
                        <div class="date-row">
                            <span class="date">Wed, Jan 17, 2024</span>
                            <span class="time">10:00 AM</span>
                        </div>
                        <div class="details">
                            <span class="room">LT2</span>
                            <span class="initials">[OO]</span>
                        </div>
                        <span class="status-badge absent">Absent</span>
                    </div>
                </div>

                <div class="timeline-item excused">
                    <div class="timeline-marker">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    </div>
                    <div class="timeline-content">
                        <div class="date-row">
                            <span class="date">Mon, Jan 22, 2024</span>
                        </div>
                        <div class="no-class-reason">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            Public Holiday - No penalty to your score
                        </div>
                        <span class="status-badge excused">No Class</span>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/app.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/api.js"></script>
    <script src="js/screens/attendance-log.js"></script>
</body>
</html>

Screen 6: Notification Center (notifications.html)

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#1e40af">

    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/screens.css">

    <title>Notifications - Attendly</title>
</head>
<body class="notifications-screen">
    <!-- Header -->
    <header class="notifications-header">
        <button class="back-btn" id="backBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
        </button>
        <h2 class="header-title">Notifications</h2>
        <button class="btn btn-text" id="markAllReadBtn">Mark All Read</button>
    </header>

    <main class="notifications-content">
        <!-- Filter Tabs -->
        <div class="filter-tabs">
            <button class="tab active" data-filter="all">All</button>
            <button class="tab" data-filter="unread">Unread</button>
            <button class="tab" data-filter="sessions">Sessions</button>
            <button class="tab" data-filter="alerts">Alerts</button>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list" id="notificationsList">
            <!-- Notification items populated dynamically -->

            <!-- Sample Notification Item -->
            <div class="notification-item unread" data-id="" data-type="session_started">
                <div class="notification-icon session">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="10,8 16,12 10,16 10,8"></polygon>
                    </svg>
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">Attendance Session Started</h4>
                    <p class="notification-message">Your MTH 202 attendance session is now active.</p>
                    <span class="notification-time">2 minutes ago</span>
                </div>
                <button class="notification-action" data-action="checkin">
                    Check-In
                </button>
            </div>

            <div class="notification-item" data-id="" data-type="attendance_approved">
                <div class="notification-icon success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">Attendance Approved</h4>
                    <p class="notification-message">Your attendance has been approved by the lecturer.</p>
                    <span class="notification-time">1 hour ago</span>
                </div>
            </div>

            <div class="notification-item" data-id="" data-type="device_alert">
                <div class="notification-icon warning">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <div class="notification-content">
                    <h4 class="notification-title">Device Alert</h4>
                    <p class="notification-message">A new device tried to log into your account. Your device has been updated.</p>
                    <span class="notification-time">2 days ago</span>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state hidden" id="emptyState">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <h3>No Notifications</h3>
            <p>You're all caught up! Check back later for updates.</p>
        </div>
    </main>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="js/app.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/api.js"></script>
    <script src="js/realtime.js"></script>
    <script src="js/screens/notifications.js"></script>
</body>
</html>

CSS Styling

main.css - Global Styles

/* =============================================
   STUDENT APP - MAIN STYLES
   ============================================= */

/* CSS Variables */
:root {
    /* Colors */
    --color-primary: #1e40af;
    --color-primary-dark: #1e3a8a;
    --color-primary-light: #3b82f6;
    --color-secondary: #64748b;
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-danger: #ef4444;
    --color-info: #3b82f6;

    /* Neutrals */
    --color-white: #ffffff;
    --color-gray-50: #f8fafc;
    --color-gray-100: #f1f5f9;
    --color-gray-200: #e2e8f0;
    --color-gray-300: #cbd5e1;
    --color-gray-400: #94a3b8;
    --color-gray-500: #64748b;
    --color-gray-600: #475569;
    --color-gray-700: #334155;
    --color-gray-800: #1e293b;
    --color-gray-900: #0f172a;

    /* Typography */
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;

    /* Spacing */
    --spacing-1: 0.25rem;
    --spacing-2: 0.5rem;
    --spacing-3: 0.75rem;
    --spacing-4: 1rem;
    --spacing-5: 1.25rem;
    --spacing-6: 1.5rem;
    --spacing-8: 2rem;
    --spacing-10: 2.5rem;
    --spacing-12: 3rem;

    /* Border Radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-full: 9999px;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
    --transition-slow: 500ms ease;
}

/* Reset */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
}

body {
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    line-height: 1.5;
    color: var(--color-gray-900);
    background-color: var(--color-gray-50);
    min-height: 100vh;
    overflow-x: hidden;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    color: var(--color-gray-900);
}

h1 { font-size: var(--font-size-3xl); }
h2 { font-size: var(--font-size-2xl); }
h3 { font-size: var(--font-size-xl); }
h4 { font-size: var(--font-size-lg); }

p {
    color: var(--color-gray-600);
}

a {
    color: var(--color-primary);
    text-decoration: none;
}

/* Form Elements */
input, select, button {
    font-family: inherit;
    font-size: inherit;
}

button {
    cursor: pointer;
    border: none;
    background: none;
}

/* Utility Classes */
.hidden {
    display: none !important;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideDown {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(20px);
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Loading Spinner */
.spinner {
    animation: spin 1s linear infinite;
}

.spinner circle {
    stroke: currentColor;
    stroke-linecap: round;
    animation: spinner-dash 1.5s ease-in-out infinite;
}

@keyframes spinner-dash {
    0% {
        stroke-dasharray: 1, 150;
        stroke-dashoffset: 0;
    }
    50% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -35;
    }
    100% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -124;
    }
}

components.css - Reusable Components

/* =============================================
   BUTTONS
   ============================================= */

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-6);
    font-weight: 500;
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
    cursor: pointer;
    border: 2px solid transparent;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background-color: var(--color-primary);
    color: var(--color-white);
}

.btn-primary:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
}

.btn-secondary {
    background-color: var(--color-white);
    color: var(--color-gray-700);
    border-color: var(--color-gray-300);
}

.btn-secondary:hover:not(:disabled) {
    background-color: var(--color-gray-50);
    border-color: var(--color-gray-400);
}

.btn-text {
    background: none;
    color: var(--color-primary);
    padding: var(--spacing-2);
}

.btn-text:hover:not(:disabled) {
    background-color: var(--color-gray-100);
}

.btn-full {
    width: 100%;
}

.btn-lg {
    padding: var(--spacing-4) var(--spacing-8);
    font-size: var(--font-size-lg);
}

.btn .btn-loader {
    display: none;
}

.btn.loading .btn-text {
    visibility: hidden;
}

.btn.loading .btn-loader {
    display: block;
    position: absolute;
}

/* =============================================
   INPUTS
   ============================================= */

.input-group {
    margin-bottom: var(--spacing-4);
}

.input-label {
    display: block;
    font-weight: 500;
    color: var(--color-gray-700);
    margin-bottom: var(--spacing-2);
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: var(--spacing-4);
    color: var(--color-gray-400);
    pointer-events: none;
}

.input-field {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    padding-left: calc(var(--spacing-4) * 3);
    border: 2px solid var(--color-gray-200);
    border-radius: var(--radius-lg);
    background-color: var(--color-white);
    transition: all var(--transition-fast);
}

.input-field:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.input-field::placeholder {
    color: var(--color-gray-400);
}

.input-error {
    display: block;
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-1);
}

/* Select */
.select-wrapper {
    position: relative;
}

.select-field {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    padding-right: calc(var(--spacing-4) * 3);
    border: 2px solid var(--color-gray-200);
    border-radius: var(--radius-lg);
    background-color: var(--color-white);
    appearance: none;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.select-field:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.select-field:disabled {
    background-color: var(--color-gray-100);
    cursor: not-allowed;
}

.select-arrow {
    position: absolute;
    right: var(--spacing-4);
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--color-gray-400);
}

/* =============================================
   MODALS
   ============================================= */

.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-4);
}

.modal.hidden {
    display: none;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    animation: fadeIn var(--transition-normal);
}

.modal-content {
    position: relative;
    background-color: var(--color-white);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 400px;
    max-height: 90vh;
    overflow-y: auto;
    animation: scaleIn var(--transition-normal);
}

.modal-content.centered {
    text-align: center;
    padding: var(--spacing-8);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4) var(--spacing-6);
    border-bottom: 1px solid var(--color-gray-200);
}

.modal-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
}

.modal-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    color: var(--color-gray-400);
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
}

.modal-close:hover {
    background-color: var(--color-gray-100);
    color: var(--color-gray-600);
}

.modal-body {
    padding: var(--spacing-6);
}

/* =============================================
   TOASTS
   ============================================= */

.toast-container {
    position: fixed;
    bottom: var(--spacing-4);
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.toast {
    padding: var(--spacing-3) var(--spacing-6);
    border-radius: var(--radius-lg);
    color: var(--color-white);
    font-weight: 500;
    box-shadow: var(--shadow-lg);
    animation: slideUp var(--transition-normal);
}

.toast-success { background-color: var(--color-success); }
.toast-error { background-color: var(--color-danger); }
.toast-warning { background-color: var(--color-warning); }
.toast-info { background-color: var(--color-info); }

/* =============================================
   CARDS
   ============================================= */

.card {
    background-color: var(--color-white);
    border-radius: var(--radius-xl);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-sm);
}

.course-card {
    background-color: var(--color-white);
    border-radius: var(--radius-xl);
    padding: var(--spacing-4);
    box-shadow: var(--shadow-sm);
    transition: all var(--transition-fast);
}

.course-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

/* =============================================
   BADGES
   ============================================= */

.badge {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-xs);
    font-weight: 600;
    border-radius: var(--radius-full);
    background-color: var(--color-primary);
    color: var(--color-white);
}

.badge-secondary {
    background-color: var(--color-gray-200);
    color: var(--color-gray-600);
}

.badge-success {
    background-color: var(--color-success);
}

.badge-warning {
    background-color: var(--color-warning);
}

.badge-danger {
    background-color: var(--color-danger);
}

/* =============================================
   PROGRESS INDICATORS
   ============================================= */

.progress-bar-mini {
    height: 6px;
    background-color: var(--color-gray-200);
    border-radius: var(--radius-full);
    overflow: hidden;
    flex: 1;
}

.progress-bar-mini .progress {
    height: 100%;
    background-color: var(--color-success);
    border-radius: var(--radius-full);
    transition: width var(--transition-normal);
}

.progress-ring {
    position: relative;
    width: 60px;
    height: 60px;
}

.progress-ring svg {
    transform: rotate(-90deg);
}

.progress-ring .ring-bg {
    stroke: var(--color-gray-200);
}

.progress-ring .ring-progress {
    stroke-linecap: round;
    transition: stroke-dasharray var(--transition-normal);
}

.progress-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-gray-700);
}

JavaScript Modules

app.js - Main Application Logic

/**
 * Main Application Module
 * Handles global state, initialization, and common utilities
 */

// Global Application State
const AppState = {
    currentUser: null,
    isAuthenticated: false,
    isOnline: navigator.onLine,

    // Cache
    colleges: [],
    departments: [],
    courses: [],

    // Realtime subscriptions
    subscriptions: [],

    // UI State
    isLoading: false,
    activeModals: []
};

// Initialize Application
async function initApp() {
    console.log('🚀 Initializing Attendly Student App...');

    // Check authentication
    const user = Auth.getCurrentUser();
    if (user) {
        AppState.currentUser = user;
        AppState.isAuthenticated = true;
    }

    // Initialize Supabase
    if (typeof window.supabase !== 'undefined') {
        window.supabaseClient = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );
        console.log('✅ Supabase initialized');
    }

    // Setup event listeners
    setupGlobalEventListeners();

    // Check online status
    updateOnlineStatus();

    console.log('✅ App initialized');
    return true;
}

// Global Event Listeners
function setupGlobalEventListeners() {
    // Online/Offline detection
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Handle page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle back button
    window.addEventListener('popstate', handleBackNavigation);
}

function updateOnlineStatus() {
    AppState.isOnline = navigator.onLine;
    const indicator = document.getElementById('offlineIndicator');
    if (indicator) {
        indicator.classList.toggle('hidden', AppState.isOnline);
    }
}

function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        // Refresh data when app becomes visible
        refreshDataIfNeeded();
    }
}

function handleBackNavigation(event) {
    // Handle custom back navigation logic
    if (AppState.activeModals.length > 0) {
        event.preventDefault();
        closeTopModal();
    }
}

// Navigation
function navigateTo(page, params = {}) {
    const url = new URL(page, window.location.origin);
    Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
    });
    window.location.href = url.toString();
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        navigateTo('dashboard.html');
    }
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        AppState.activeModals.push(modalId);
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        AppState.activeModals = AppState.activeModals.filter(m => m !== modalId);
        if (AppState.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
    }
}

function closeTopModal() {
    if (AppState.activeModals.length > 0) {
        closeModal(AppState.activeModals[AppState.activeModals.length - 1]);
    }
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideDown var(--transition-normal) forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Loading State
function showLoading(button) {
    button.classList.add('loading');
    button.disabled = true;
}

function hideLoading(button) {
    button.classList.remove('loading');
    button.disabled = false;
}

// Data Refresh
async function refreshDataIfNeeded() {
    // Check if data needs refresh based on last update time
    const lastUpdate = localStorage.getItem('lastDataUpdate');
    const now = Date.now();
    const refreshInterval = 5 * 60 * 1000; // 5 minutes

    if (!lastUpdate || (now - parseInt(lastUpdate)) > refreshInterval) {
        await refreshAllData();
    }
}

async function refreshAllData() {
    if (!AppState.isAuthenticated) return;

    try {
        // Refresh user data
        const userResult = await StudentAPI.getProfile(AppState.currentUser.id);
        if (userResult.success) {
            AppState.currentUser = userResult.data;
            Auth.setCurrentUser(userResult.data, 'student');
        }

        localStorage.setItem('lastDataUpdate', Date.now().toString());
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);

// Configuration
const CONFIG = {
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    APP_NAME: 'Attendly',
    APP_VERSION: '1.0.0'
};

fingerprint.js - FingerprintJS Integration

/**
 * Device Fingerprint Module
 * Handles device identification and binding using FingerprintJS
 */

const FingerprintModule = {
    fpPromise: null,

    /**
     * Initialize FingerprintJS
     */
    async init() {
        if (typeof FingerprintJS === 'undefined') {
            console.error('FingerprintJS not loaded');
            return false;
        }

        this.fpPromise = FingerprintJS.load({
            debug: false,
            excludes: {
                // Exclude unstable components
                enumerateDevices: true,
                pixelRatio: true,
                doNotTrack: true
            }
        });

        console.log('✅ FingerprintJS initialized');
        return true;
    },

    /**
     * Generate device fingerprint
     * @returns {Promise<Object>} Fingerprint result
     */
    async generate() {
        if (!this.fpPromise) {
            await this.init();
        }

        try {
            const fp = await this.fpPromise;
            const result = await fp.get();

            return {
                success: true,
                visitorId: result.visitorId,
                confidence: result.confidence,
                components: result.components
            };
        } catch (error) {
            console.error('Fingerprint generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Get device metadata
     * @returns {Object} Device information
     */
    getDeviceInfo() {
        const ua = navigator.userAgent;

        return {
            name: this.getDeviceName(ua),
            os: this.getOS(ua),
            browser: this.getBrowser(ua),
            userAgent: ua,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    },

    getDeviceName(ua) {
        if (/iPad/.test(ua)) return 'iPad';
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/Android/.test(ua)) {
            const match = ua.match(/Android.*?;\s*([^;)]+)/);
            return match ? match[1].trim() : 'Android Device';
        }
        if (/Windows/.test(ua)) return 'Windows PC';
        if (/Mac/.test(ua)) return 'Mac';
        if (/Linux/.test(ua)) return 'Linux PC';
        return 'Unknown Device';
    },

    getOS(ua) {
        if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
        if (/Mac OS X/.test(ua)) {
            const match = ua.match(/Mac OS X (\d+[._]\d+)/);
            return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
        }
        if (/Android/.test(ua)) {
            const match = ua.match(/Android (\d+\.?\d*)/);
            return match ? `Android ${match[1]}` : 'Android';
        }
        if (/iPhone|iPad/.test(ua)) {
            const match = ua.match(/OS (\d+[._]\d+)/);
            return match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
        }
        if (/Linux/.test(ua)) return 'Linux';
        return 'Unknown OS';
    },

    getBrowser(ua) {
        if (/Edg/.test(ua)) return 'Edge';
        if (/OPR|Opera/.test(ua)) return 'Opera';
        if (/Chrome/.test(ua)) return 'Chrome';
        if (/Firefox/.test(ua)) return 'Firefox';
        if (/Safari/.test(ua)) return 'Safari';
        return 'Unknown Browser';
    }
};

/**
 * Device Binding Flow
 * Called during onboarding Step 3
 */
async function bindDevice(studentId) {
    // Show loading state
    const bindBtn = document.getElementById('bindDeviceBtn');
    const statusEl = document.getElementById('bindingStatus');
    const animationEl = document.getElementById('securityAnimation');

    if (bindBtn) {
        bindBtn.disabled = true;
        bindBtn.innerHTML = `
            <svg class="spinner" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
            </svg>
            Processing...
        `;
    }

    if (statusEl) {
        statusEl.innerHTML = '<p class="status-text scanning">Scanning device characteristics...</p>';
    }

    if (animationEl) {
        animationEl.classList.add('scanning');
    }

    try {
        // Generate fingerprint
        const fpResult = await FingerprintModule.generate();

        if (!fpResult.success) {
            throw new Error(fpResult.error || 'Failed to generate fingerprint');
        }

        // Update status
        if (statusEl) {
            statusEl.innerHTML = '<p class="status-text">Registering device...</p>';
        }

        // Register device with backend
        const deviceInfo = FingerprintModule.getDeviceInfo();
        const result = await DeviceAPI.registerDevice(studentId, 'student', deviceInfo);

        if (!result.success) {
            throw new Error(result.error || 'Failed to register device');
        }

        // Show device preview
        const previewEl = document.getElementById('devicePreview');
        if (previewEl) {
            previewEl.classList.remove('hidden');
            document.getElementById('deviceName').textContent = deviceInfo.name;
            document.getElementById('deviceBrowser').textContent = deviceInfo.browser;
            document.getElementById('deviceOS').textContent = deviceInfo.os;
        }

        // Success state
        if (animationEl) {
            animationEl.classList.remove('scanning');
            animationEl.classList.add('success');
        }

        if (statusEl) {
            statusEl.innerHTML = `
                <p class="status-text success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    Device secured successfully!
                </p>
            `;
        }

        showToast('Device registered successfully!', 'success');

        return {
            success: true,
            deviceId: result.deviceId,
            isPrimary: result.isPrimary
        };

    } catch (error) {
        console.error('Device binding error:', error);

        if (animationEl) {
            animationEl.classList.remove('scanning');
            animationEl.classList.add('error');
        }

        if (statusEl) {
            statusEl.innerHTML = `
                <p class="status-text error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    ${error.message}
                </p>
            `;
        }

        if (bindBtn) {
            bindBtn.disabled = false;
            bindBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Try Again
            `;
        }

        showToast(error.message, 'error');

        return {
            success: false,
            error: error.message
        };
    }
}

Device Binding with FingerprintJS (Detailed Implementation)

Complete Fingerprinting Lifecycle

/**
 * =============================================
 * DEVICE FINGERPRINTING LIFECYCLE
 * =============================================
 *
 * 1. GENERATION (During Onboarding)
 *    - Load FingerprintJS library
 *    - Collect device signals (canvas, WebGL, fonts, etc.)
 *    - Generate unique visitorId
 *    - Collect device metadata
 *
 * 2. STORAGE (Registration)
 *    - Send fingerprint to backend
 *    - Store in device_registry table
 *    - Mark as verified and primary
 *    - Associate with student account
 *
 * 3. VALIDATION (During Check-in)
 *    - Generate current fingerprint
 *    - Retrieve stored fingerprint from database
 *    - Compare fingerprints
 *    - Determine if match or mismatch
 *
 * 4. OVERRIDE (Lecturer Approval)
 *    - If mismatch detected
 *    - Send to pending approval queue
 *    - Lecturer reviews and approves/rejects
 *    - If approved, update stored fingerprint
 */

class DeviceFingerprintManager {
    constructor() {
        this.fpInstance = null;
        this.currentFingerprint = null;
        this.storedFingerprint = null;
    }

    /**
     * STEP 1: GENERATION
     * Generate a device fingerprint during onboarding
     */
    async generateFingerprint() {
        console.log('🔍 Starting fingerprint generation...');

        // Load FingerprintJS if not loaded
        if (typeof FingerprintJS === 'undefined') {
            await this.loadFingerprintJS();
        }

        // Initialize FingerprintJS
        this.fpInstance = await FingerprintJS.load({
            debug: false,
            // Exclude unstable components that might change
            excludes: {
                enumerateDevices: true,  // Audio/video devices can change
                pixelRatio: true,        // Can change with display scaling
                doNotTrack: true,        // Browser setting, not device
                // Keep these for accuracy:
                // - canvas (very stable)
                // - webgl (stable)
                // - fonts (stable)
                // - audioContext (stable)
            }
        });

        // Get the fingerprint
        const result = await this.fpInstance.get();

        this.currentFingerprint = {
            visitorId: result.visitorId,
            confidence: result.confidence,
            components: this.extractComponentData(result.components),
            generatedAt: new Date().toISOString()
        };

        console.log('✅ Fingerprint generated:', {
            visitorId: result.visitorId,
            confidence: result.confidence.score
        });

        return this.currentFingerprint;
    }

    /**
     * Extract relevant component data for storage
     */
    extractComponentData(components) {
        const data = {};
        const relevantKeys = [
            'platform', 'timezone', 'language', 'colorDepth',
            'deviceMemory', 'hardwareConcurrency', 'screenResolution',
            'availableScreenResolution', 'touchSupport'
        ];

        for (const key of relevantKeys) {
            if (components[key]) {
                data[key] = components[key].value;
            }
        }

        return data;
    }

    /**
     * STEP 2: STORAGE
     * Register the fingerprint with the backend
     */
    async registerFingerprint(userId, userType = 'student') {
        if (!this.currentFingerprint) {
            await this.generateFingerprint();
        }

        const deviceInfo = this.getDeviceInfo();

        const registrationData = {
            user_id: userId,
            user_type: userType,
            device_fingerprint: this.currentFingerprint.visitorId,
            device_name: deviceInfo.name,
            device_os: deviceInfo.os,
            device_browser: deviceInfo.browser,
            user_agent: navigator.userAgent,
            is_verified: true,
            is_primary: true,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            confidence_score: this.currentFingerprint.confidence.score
        };

        try {
            const { data, error } = await supabase
                .from('device_registry')
                .insert(registrationData)
                .select()
                .single();

            if (error) {
                // Check if device already exists
                if (error.code === '23505') {
                    // Update existing device
                    const { data: updated, error: updateError } = await supabase
                        .from('device_registry')
                        .update({
                            last_seen: new Date().toISOString(),
                            device_name: deviceInfo.name,
                            device_os: deviceInfo.os,
                            device_browser: deviceInfo.browser
                        })
                        .eq('user_id', userId)
                        .eq('user_type', userType)
                        .eq('device_fingerprint', this.currentFingerprint.visitorId)
                        .select()
                        .single();

                    if (updateError) throw updateError;
                    return { success: true, data: updated, isNew: false };
                }
                throw error;
            }

            console.log('✅ Device registered successfully');
            return { success: true, data, isNew: true };

        } catch (error) {
            console.error('❌ Device registration failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * STEP 3: VALIDATION
     * Validate device during check-in
     */
    async validateDevice(userId, userType = 'student') {
        console.log('🔐 Validating device...');

        // Generate current fingerprint
        const currentFp = await this.generateFingerprint();

        // Get stored fingerprint from database
        const { data: storedDevices, error } = await supabase
            .from('device_registry')
            .select('*')
            .eq('user_id', userId)
            .eq('user_type', userType)
            .eq('is_blocked', false)
            .order('is_primary', { ascending: false });

        if (error) {
            return {
                isValid: false,
                reason: 'database_error',
                error: error.message
            };
        }

        if (!storedDevices || storedDevices.length === 0) {
            return {
                isValid: false,
                reason: 'no_registered_device',
                needsRegistration: true,
                currentFingerprint: currentFp.visitorId
            };
        }

        // Check if current fingerprint matches any stored device
        const matchingDevice = storedDevices.find(
            device => device.device_fingerprint === currentFp.visitorId
        );

        if (matchingDevice) {
            // Update last seen
            await supabase
                .from('device_registry')
                .update({ last_seen: new Date().toISOString() })
                .eq('id', matchingDevice.id);

            console.log('✅ Device validated successfully');
            return {
                isValid: true,
                deviceId: matchingDevice.id,
                isPrimary: matchingDevice.is_primary,
                confidence: currentFp.confidence
            };
        }

        // Device mismatch
        console.warn('⚠️ Device mismatch detected');
        return {
            isValid: false,
            reason: 'device_mismatch',
            needsApproval: true,
            currentFingerprint: currentFp.visitorId,
            registeredDevices: storedDevices.map(d => ({
                id: d.id,
                name: d.device_name,
                os: d.device_os,
                isPrimary: d.is_primary
            })),
            currentDeviceInfo: this.getDeviceInfo()
        };
    }

    /**
     * STEP 4: OVERRIDE
     * Update device after lecturer approval
     */
    async updateDeviceAfterApproval(userId, userType, newFingerprint, approvedBy) {
        console.log('🔄 Updating device after approval...');

        try {
            // Mark all existing devices as non-primary
            await supabase
                .from('device_registry')
                .update({ is_primary: false })
                .eq('user_id', userId)
                .eq('user_type', userType);

            // Register new device as primary
            const deviceInfo = this.getDeviceInfo();

            const { data, error } = await supabase
                .from('device_registry')
                .insert({
                    user_id: userId,
                    user_type: userType,
                    device_fingerprint: newFingerprint,
                    device_name: deviceInfo.name,
                    device_os: deviceInfo.os,
                    device_browser: deviceInfo.browser,
                    user_agent: navigator.userAgent,
                    is_verified: true,
                    is_primary: true,
                    verified_by: approvedBy,
                    verified_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Device updated successfully');
            return { success: true, data };

        } catch (error) {
            console.error('❌ Device update failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load FingerprintJS library dynamically
     */
    async loadFingerprintJS() {
        return new Promise((resolve, reject) => {
            if (typeof FingerprintJS !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://openfpcdn.io/fingerprintjs/v4';
            script.crossOrigin = 'anonymous';

            script.onload = () => {
                console.log('✅ FingerprintJS loaded');
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Failed to load FingerprintJS'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Get device information
     */
    getDeviceInfo() {
        const ua = navigator.userAgent;
        return {
            name: this.parseDeviceName(ua),
            os: this.parseOS(ua),
            browser: this.parseBrowser(ua),
            userAgent: ua,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    parseDeviceName(ua) {
        if (/iPad/.test(ua)) return 'iPad';
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/Android/.test(ua)) {
            const match = ua.match(/Android.*?;\s*([^;)]+)/);
            return match ? match[1].trim() : 'Android Device';
        }
        if (/Windows/.test(ua)) return 'Windows PC';
        if (/Mac/.test(ua)) return 'Mac';
        if (/Linux/.test(ua)) return 'Linux PC';
        return 'Unknown Device';
    }

    parseOS(ua) {
        if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
        if (/Mac OS X/.test(ua)) {
            const match = ua.match(/Mac OS X (\d+[._]\d+)/);
            return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
        }
        if (/Android/.test(ua)) {
            const match = ua.match(/Android (\d+\.?\d*)/);
            return match ? `Android ${match[1]}` : 'Android';
        }
        if (/iPhone|iPad/.test(ua)) {
            const match = ua.match(/OS (\d+[._]\d+)/);
            return match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
        }
        return 'Unknown OS';
    }

    parseBrowser(ua) {
        if (/Edg/.test(ua)) return 'Edge';
        if (/OPR|Opera/.test(ua)) return 'Opera';
        if (/Chrome/.test(ua)) return 'Chrome';
        if (/Firefox/.test(ua)) return 'Firefox';
        if (/Safari/.test(ua)) return 'Safari';
        return 'Unknown Browser';
    }
}

// Export singleton instance
const DeviceManager = new DeviceFingerprintManager();

Security Implications & Anti-Spoofing

/**
 * SECURITY CONSIDERATIONS FOR DEVICE FINGERPRINTING
 *
 * 1. LIMITATIONS OF FINGERPRINTING
 *    - Fingerprint can change with browser updates
 *    - Different browsers on same device = different fingerprints
 *    - Privacy-focused browsers may block fingerprinting
 *    - Incognito/private mode may generate different fingerprint
 *
 * 2. ANTI-SPOOFING MEASURES
 *    - Use confidence score from FingerprintJS
 *    - Combine with GPS validation
 *    - Monitor for rapid device changes
 *    - Log all validation attempts
 *    - Require re-authentication for suspicious activity
 *
 * 3. BEST PRACTICES
 *    - Store hashed fingerprints when possible
 *    - Implement rate limiting on device registration
 *    - Allow multiple registered devices per user
 *    - Notify users of device changes
 *    - Provide device management UI
 */

const SecurityEnhancements = {
    /**
     * Validate fingerprint with confidence threshold
     */
    async validateWithConfidence(fpResult, threshold = 0.5) {
        if (!fpResult.success) {
            return {
                valid: false,
                reason: 'generation_failed'
            };
        }

        if (fpResult.confidence.score < threshold) {
            console.warn('Low confidence score:', fpResult.confidence.score);
            return {
                valid: false,
                reason: 'low_confidence',
                score: fpResult.confidence.score
            };
        }

        return {
            valid: true,
            score: fpResult.confidence.score
        };
    },

    /**
     * Detect suspicious device change patterns
     */
    async checkDeviceChangePatterns(userId, userType) {
        const { data: devices } = await supabase
            .from('device_registry')
            .select('*')
            .eq('user_id', userId)
            .eq('user_type', userType)
            .order('last_seen', { ascending: false })
            .limit(5);

        if (!devices || devices.length < 2) {
            return { suspicious: false };
        }

        // Check for rapid device switching
        const now = Date.now();
        const recentChanges = devices.filter(d => {
            const lastSeen = new Date(d.last_seen).getTime();
            return (now - lastSeen) < 24 * 60 * 60 * 1000; // Within 24 hours
        });

        if (recentChanges.length > 3) {
            return {
                suspicious: true,
                reason: 'rapid_device_switching',
                details: recentChanges
            };
        }

        return { suspicious: false };
    },

    /**
     * Log device validation attempt
     */
    async logValidationAttempt(userId, userType, result) {
        await supabase
            .from('audit_logs')
            .insert({
                user_id: userId,
                user_type: userType,
                action: 'device_validation',
                entity_type: 'device_registry',
                new_values: {
                    valid: result.isValid,
                    reason: result.reason,
                    timestamp: new Date().toISOString()
                }
            });
    }
};

GPS Validation Implementation

/**
 * GPS Validation Module
 * Handles geolocation and distance calculations
 */

const GPSModule = {
    watchId: null,
    currentPosition: null,

    /**
     * Get current GPS position
     */
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    };
                    resolve(this.currentPosition);
                },
                (error) => {
                    let message;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Location permission denied. Please enable location access.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Location information unavailable.';
                            break;
                        case error.TIMEOUT:
                            message = 'Location request timed out.';
                            break;
                        default:
                            message = 'An unknown error occurred.';
                    }
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        });
    },

    /**
     * Start watching position for real-time updates
     */
    startWatchingPosition(callback) {
        if (!navigator.geolocation) return;

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                if (callback) callback(this.currentPosition);
            },
            (error) => console.error('Watch position error:', error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );
    },

    /**
     * Stop watching position
     */
    stopWatchingPosition() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    },

    /**
     * Calculate distance between two points (Haversine formula)
     * @returns {number} Distance in meters
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    },

    /**
     * Validate if user is within geofence
     */
    validateGeofence(userLat, userLon, centerLat, centerLon, radiusMeters) {
        const distance = this.calculateDistance(userLat, userLon, centerLat, centerLon);

        return {
            isValid: distance <= radiusMeters,
            distance: Math.round(distance),
            radius: radiusMeters,
            message: distance <= radiusMeters
                ? `Within allowed area (${Math.round(distance)}m from center)`
                : `Too far from session location (${Math.round(distance)}m, max: ${radiusMeters}m)`
        };
    },

    /**
     * Request location permission
     */
    async requestPermission() {
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return {
                granted: result.state === 'granted',
                prompt: result.state === 'prompt',
                denied: result.state === 'denied'
            };
        } catch (error) {
            // Fallback for browsers that don't support permissions API
            try {
                await this.getCurrentPosition();
                return { granted: true };
            } catch (e) {
                return { granted: false, denied: true };
            }
        }
    }
};

Realtime Subscriptions

/**
 * Realtime Module
 * Handles Supabase Realtime subscriptions for live updates
 */

const RealtimeModule = {
    channels: {},

    /**
     * Subscribe to active session notifications
     */
    subscribeToActiveSessions(studentId, onSessionStart) {
        const channel = supabase
            .channel(`student-sessions:${studentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'session_notifications',
                    filter: `student_id=eq.${studentId}`
                },
                (payload) => {
                    console.log('New notification:', payload);
                    if (payload.new.notification_type === 'session_started') {
                        onSessionStart(payload.new);
                    }
                }
            )
            .subscribe();

        this.channels[`sessions:${studentId}`] = channel;
        return channel;
    },

    /**
     * Subscribe to attendance updates
     */
    subscribeToAttendanceUpdates(studentId, onUpdate) {
        const channel = supabase
            .channel(`student-attendance:${studentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'attendance_logs',
                    filter: `student_id=eq.${studentId}`
                },
                (payload) => {
                    console.log('Attendance update:', payload);
                    onUpdate(payload);
                }
            )
            .subscribe();

        this.channels[`attendance:${studentId}`] = channel;
        return channel;
    },

    /**
     * Unsubscribe from all channels
     */
    async unsubscribeAll() {
        for (const key of Object.keys(this.channels)) {
            await supabase.removeChannel(this.channels[key]);
        }
        this.channels = {};
    }
};

Error Handling

/**
 * Error Handling Module
 * Centralized error handling and user-friendly messages
 */

const ErrorHandler = {
    // Error code to user message mapping
    messages: {
        'INVALID_SESSION': 'The session code is invalid or has expired.',
        'SESSION_EXPIRED': 'This attendance session has ended.',
        'ALREADY_CHECKED_IN': 'You have already checked in for this session.',
        'DEVICE_MISMATCH': 'Your device does not match the registered device.',
        'GPS_UNAVAILABLE': 'Unable to get your location. Please enable GPS.',
        'GPS_PERMISSION_DENIED': 'Location permission denied. Please allow location access.',
        'NOT_ENROLLED': 'You are not enrolled in this course.',
        'NETWORK_ERROR': 'Network error. Please check your internet connection.',
        'AUTH_FAILED': 'Authentication failed. Please try again.',
        'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
    },

    /**
     * Handle error and show user-friendly message
     */
    handle(error, showToast = true) {
        console.error('Error:', error);

        const code = error.code || error.message || 'UNKNOWN_ERROR';
        const message = this.messages[code] || this.messages.UNKNOWN_ERROR;

        if (showToast) {
            showToast(message, 'error');
        }

        return {
            success: false,
            code,
            message
        };
    },

    /**
     * Handle API errors
     */
    handleApiError(error) {
        if (error.message?.includes('Failed to fetch')) {
            return this.handle({ code: 'NETWORK_ERROR' });
        }

        if (error.code === 'PGRST116') {
            return this.handle({ code: 'NOT_FOUND' });
        }

        return this.handle(error);
    }
};

Security Considerations

Client-Side Security

- Input Validation: All user inputs are validated before processing

- XSS Prevention: Use textContent instead of innerHTML for user data

- CSRF Protection: Rely on Supabase's built-in CSRF protection

- Secure Storage: Use localStorage carefully, avoid storing sensitive data

- Transport Security: All API calls use HTTPS

Device Fingerprinting Security

- Limitations:

- Fingerprints can change with browser updates

- Different browsers = different fingerprints

- Not foolproof against determined attackers

- Mitigations:

- Combine with GPS validation

- Use confidence scores

- Monitor for suspicious patterns

- Allow manual override by lecturer

- Privacy:

- Inform users about fingerprinting

- Allow device management

- Provide notification on device changes

GPS Validation Security

- Limitations:

- GPS can be spoofed

- Accuracy varies by device/location

- Mitigations:

- Require high accuracy mode

- Check accuracy confidence

- Combine with other factors

Document Version: 1.0.0 Last Updated: 2024 For: University Attendance Management PWA - Student Application