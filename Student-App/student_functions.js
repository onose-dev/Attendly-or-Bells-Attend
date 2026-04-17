/**
 * ============================================================
 * STUDENT FUNCTIONS - Attendly Attendance Management System
 * ============================================================
 * Source: Student-App_build.md
 * Depends on: supabase (global), FingerprintJS (CDN), navigator APIs
 *
 * MODULES:
 *  - AppState & initApp()          → Global state and app bootstrap
 *  - Auth                          → Student auth (referenced, extend as needed)
 *  - FingerprintModule             → FingerprintJS wrapper (generate, device info)
 *  - DeviceFingerprintManager      → Full fingerprint lifecycle (register, validate, update)
 *  - SecurityEnhancements          → Confidence checks and suspicious pattern detection
 *  - DeviceAPI                     → Register device fingerprint to backend
 *  - GPSModule                     → Geolocation, distance calculation, geofencing
 *  - RealtimeModule                → Live session & attendance subscriptions
 *  - ErrorHandler                  → Centralised error messaging
 *  - showToast()                   → Global UI toast notification helper
 *  - Modal helpers                 → openModal / closeModal / closeTopModal
 *  - Navigation helpers            → navigateTo / goBack
 *  - Loading helpers               → showLoading / hideLoading
 *  - bindDevice()                  → Onboarding Step 3: device binding UI flow
 * ============================================================
 */


// ============================================================
// CONFIG — Supabase credentials (replace before deploying)
// ============================================================

const CONFIG = {
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  APP_NAME: 'Attendly',
  APP_VERSION: '1.0.0'
};


// ============================================================
// AppState — Global Application State
// ============================================================

const AppState = {
  currentUser: null,
  isAuthenticated: false,
  isOnline: navigator.onLine,

  // Cached reference data
  colleges: [],
  departments: [],
  courses: [],

  // Active Supabase subscriptions
  subscriptions: [],

  // UI state
  isLoading: false,
  activeModals: []
};


// ============================================================
// initApp — Bootstrap the Student Application
// ============================================================

/**
 * Initialize the app on DOMContentLoaded.
 * Sets up Supabase, auth state, event listeners, and online detection.
 * @returns {Promise<boolean>}
 */
async function initApp() {
  console.log('🚀 Initializing Attendly Student App...');

  const user = Auth.getCurrentUser();
  if (user) {
    AppState.currentUser = user;
    AppState.isAuthenticated = true;
  }

  if (typeof window.supabase !== 'undefined') {
    window.supabaseClient = window.supabase.createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase initialized');
  }

  setupGlobalEventListeners();
  updateOnlineStatus();

  console.log('✅ App initialized');
  return true;
}

document.addEventListener('DOMContentLoaded', initApp);


// ============================================================
// Global Event Listeners
// ============================================================

function setupGlobalEventListeners() {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('popstate', handleBackNavigation);
}

function updateOnlineStatus() {
  AppState.isOnline = navigator.onLine;
  const indicator = document.getElementById('offlineIndicator');
  if (indicator) indicator.classList.toggle('hidden', AppState.isOnline);
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshDataIfNeeded();
  }
}

function handleBackNavigation(event) {
  if (AppState.activeModals.length > 0) {
    event.preventDefault();
    closeTopModal();
  }
}


// ============================================================
// Navigation Helpers
// ============================================================

/**
 * Navigate to a page with optional query parameters.
 * @param {string} page     - Relative page path (e.g. 'dashboard.html')
 * @param {object} params   - Key/value query params
 */
function navigateTo(page, params = {}) {
  const url = new URL(page, window.location.origin);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  window.location.href = url.toString();
}

/**
 * Navigate back in history, or fall back to the dashboard.
 */
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigateTo('dashboard.html');
  }
}


// ============================================================
// Modal Helpers
// ============================================================

/**
 * Open a modal by its element ID.
 * @param {string} modalId
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    AppState.activeModals.push(modalId);
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close a modal by its element ID.
 * @param {string} modalId
 */
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

/** Close the most recently opened modal. */
function closeTopModal() {
  if (AppState.activeModals.length > 0) {
    closeModal(AppState.activeModals[AppState.activeModals.length - 1]);
  }
}


// ============================================================
// Toast Notifications
// ============================================================

/**
 * Show a transient toast notification.
 * Requires a <div id="toastContainer"> in the page HTML.
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} type
 * @param {number} [duration=3000]
 */
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


// ============================================================
// Loading State Helpers
// ============================================================

/**
 * Put a button into a loading state.
 * @param {HTMLButtonElement} button
 */
function showLoading(button) {
  button.classList.add('loading');
  button.disabled = true;
}

/**
 * Restore a button from its loading state.
 * @param {HTMLButtonElement} button
 */
function hideLoading(button) {
  button.classList.remove('loading');
  button.disabled = false;
}


// ============================================================
// Data Refresh Helpers
// ============================================================

/**
 * Refresh all user data if more than 5 minutes have passed since last refresh.
 */
async function refreshDataIfNeeded() {
  const lastUpdate = localStorage.getItem('lastDataUpdate');
  const now = Date.now();
  const refreshInterval = 5 * 60 * 1000; // 5 minutes

  if (!lastUpdate || (now - parseInt(lastUpdate)) > refreshInterval) {
    await refreshAllData();
  }
}

/**
 * Fetch and update current user profile from the backend.
 */
async function refreshAllData() {
  if (!AppState.isAuthenticated) return;

  try {
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


// ============================================================
// FingerprintModule — FingerprintJS Wrapper
// ============================================================

const FingerprintModule = {
  fpPromise: null,

  /**
   * Initialize the FingerprintJS library.
   * @returns {Promise<boolean>}
   */
  async init() {
    if (typeof FingerprintJS === 'undefined') {
      console.error('FingerprintJS not loaded');
      return false;
    }

    this.fpPromise = FingerprintJS.load({
      debug: false,
      excludes: {
        enumerateDevices: true,
        pixelRatio: true,
        doNotTrack: true
      }
    });

    console.log('✅ FingerprintJS initialized');
    return true;
  },

  /**
   * Generate the current device fingerprint.
   * @returns {Promise<{success: boolean, visitorId?: string, confidence?: object, components?: object, error?: string}>}
   */
  async generate() {
    if (!this.fpPromise) await this.init();

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
      return { success: false, error: error.message };
    }
  },

  /**
   * Get device metadata from navigator.userAgent.
   * @returns {{name: string, os: string, browser: string, userAgent: string, screenWidth: number, screenHeight: number, language: string, timezone: string}}
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


// ============================================================
// DeviceFingerprintManager — Full Fingerprint Lifecycle
// ============================================================

class DeviceFingerprintManager {
  constructor() {
    this.fpInstance = null;
    this.currentFingerprint = null;
  }

  /**
   * STEP 1 — Generate the current device fingerprint.
   * @returns {Promise<{visitorId: string, confidence: object, components: object, generatedAt: string}>}
   */
  async generateFingerprint() {
    console.log('🔍 Starting fingerprint generation...');

    if (typeof FingerprintJS === 'undefined') {
      await this.loadFingerprintJS();
    }

    this.fpInstance = await FingerprintJS.load({
      debug: false,
      excludes: {
        enumerateDevices: true,
        pixelRatio: true,
        doNotTrack: true
      }
    });

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
   * Extract a minimal, stable subset of fingerprint component data.
   * @param {object} components
   * @returns {object}
   */
  extractComponentData(components) {
    const data = {};
    const relevantKeys = [
      'platform', 'timezone', 'language', 'colorDepth',
      'deviceMemory', 'hardwareConcurrency', 'screenResolution',
      'availableScreenResolution', 'touchSupport'
    ];

    for (const key of relevantKeys) {
      if (components[key]) data[key] = components[key].value;
    }

    return data;
  }

  /**
   * STEP 2 — Register the current device fingerprint to the backend.
   * @param {string} userId
   * @param {string} [userType='student']
   * @returns {Promise<{success: boolean, data?: object, isNew?: boolean, error?: string}>}
   */
  async registerFingerprint(userId, userType = 'student') {
    if (!this.currentFingerprint) await this.generateFingerprint();

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
        // Handle duplicate: update existing instead
        if (error.code === '23505') {
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
   * STEP 3 — Validate the current device against stored records.
   * @param {string} userId
   * @param {string} [userType='student']
   * @returns {Promise<{isValid: boolean, reason?: string, deviceId?: string, isPrimary?: boolean, needsApproval?: boolean, currentDeviceInfo?: object}>}
   */
  async validateDevice(userId, userType = 'student') {
    console.log('🔐 Validating device...');

    const currentFp = await this.generateFingerprint();

    const { data: storedDevices, error } = await supabase
      .from('device_registry')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_blocked', false)
      .order('is_primary', { ascending: false });

    if (error) {
      return { isValid: false, reason: 'database_error', error: error.message };
    }

    if (!storedDevices || storedDevices.length === 0) {
      return {
        isValid: false,
        reason: 'no_registered_device',
        needsRegistration: true,
        currentFingerprint: currentFp.visitorId
      };
    }

    const matchingDevice = storedDevices.find(
      d => d.device_fingerprint === currentFp.visitorId
    );

    if (matchingDevice) {
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

    // Mismatch
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
   * STEP 4 — Update stored device record after lecturer approval.
   * @param {string} userId
   * @param {string} userType
   * @param {string} newFingerprint
   * @param {string} approvedBy  - Lecturer ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async updateDeviceAfterApproval(userId, userType, newFingerprint, approvedBy) {
    console.log('🔄 Updating device after approval...');

    try {
      // Demote all existing devices
      await supabase
        .from('device_registry')
        .update({ is_primary: false })
        .eq('user_id', userId)
        .eq('user_type', userType);

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
   * Dynamically load the FingerprintJS script if not already present.
   * @returns {Promise<void>}
   */
  async loadFingerprintJS() {
    return new Promise((resolve, reject) => {
      if (typeof FingerprintJS !== 'undefined') { resolve(); return; }

      const script = document.createElement('script');
      script.src = 'https://openfpcdn.io/fingerprintjs/v4';
      script.crossOrigin = 'anonymous';
      script.onload = () => { console.log('✅ FingerprintJS loaded'); resolve(); };
      script.onerror = () => reject(new Error('Failed to load FingerprintJS'));
      document.head.appendChild(script);
    });
  }

  /**
   * Get device metadata from userAgent.
   * @returns {object}
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

/** Singleton instance — use this throughout the app */
const DeviceManager = new DeviceFingerprintManager();


// ============================================================
// DeviceAPI — Backend Device Registration
// ============================================================

const DeviceAPI = {
  /**
   * Register the current device fingerprint for a user.
   * @param {string} userId
   * @param {string} userType  - 'student' or 'lecturer'
   * @param {object} deviceInfo  - From FingerprintModule.getDeviceInfo()
   * @returns {Promise<{success: boolean, deviceId?: string, isPrimary?: boolean, error?: string}>}
   */
  async registerDevice(userId, userType, deviceInfo) {
    const fpResult = await FingerprintModule.generate();
    if (!fpResult.success) return { success: false, error: fpResult.error };

    const { data, error } = await supabase
      .from('device_registry')
      .insert({
        user_id: userId,
        user_type: userType,
        device_fingerprint: fpResult.visitorId,
        device_name: deviceInfo.name,
        device_os: deviceInfo.os,
        device_browser: deviceInfo.browser,
        user_agent: navigator.userAgent,
        is_verified: true,
        is_primary: true,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, deviceId: data.id, isPrimary: data.is_primary };
  }
};


// ============================================================
// SecurityEnhancements — Anti-Spoofing & Audit Helpers
// ============================================================

const SecurityEnhancements = {
  /**
   * Check the confidence score meets a minimum threshold.
   * @param {object} fpResult  - From FingerprintModule.generate()
   * @param {number} [threshold=0.5]
   * @returns {{valid: boolean, reason?: string, score?: number}}
   */
  async validateWithConfidence(fpResult, threshold = 0.5) {
    if (!fpResult.success) return { valid: false, reason: 'generation_failed' };

    if (fpResult.confidence.score < threshold) {
      console.warn('Low confidence score:', fpResult.confidence.score);
      return { valid: false, reason: 'low_confidence', score: fpResult.confidence.score };
    }

    return { valid: true, score: fpResult.confidence.score };
  },

  /**
   * Check for suspicious rapid device-switching in the past 24 hours.
   * @param {string} userId
   * @param {string} userType
   * @returns {Promise<{suspicious: boolean, reason?: string, details?: Array}>}
   */
  async checkDeviceChangePatterns(userId, userType) {
    const { data: devices } = await supabase
      .from('device_registry')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .order('last_seen', { ascending: false })
      .limit(5);

    if (!devices || devices.length < 2) return { suspicious: false };

    const now = Date.now();
    const recentChanges = devices.filter(d => {
      const lastSeen = new Date(d.last_seen).getTime();
      return (now - lastSeen) < 24 * 60 * 60 * 1000;
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
   * Write a device validation attempt to the audit log.
   * @param {string} userId
   * @param {string} userType
   * @param {{isValid: boolean, reason?: string}} result
   */
  async logValidationAttempt(userId, userType, result) {
    await supabase.from('audit_logs').insert({
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


// ============================================================
// GPSModule — Geolocation and Geofencing
// ============================================================

const GPSModule = {
  watchId: null,
  currentPosition: null,

  /**
   * Get the device's current GPS position (one-time).
   * @returns {Promise<{latitude, longitude, accuracy, altitude, heading, speed, timestamp}>}
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
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  },

  /**
   * Begin watching the device's position for continuous updates.
   * @param {Function} callback  - Called with each new {latitude, longitude, accuracy}
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  },

  /** Stop watching the device's position. */
  stopWatchingPosition() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  },

  /**
   * Calculate the distance between two GPS coordinates using the Haversine formula.
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  /**
   * Check whether a user is within the allowed geofence radius.
   * @param {number} userLat
   * @param {number} userLon
   * @param {number} centerLat  - Room/session centre latitude
   * @param {number} centerLon  - Room/session centre longitude
   * @param {number} radiusMeters
   * @returns {{isValid: boolean, distance: number, radius: number, message: string}}
   */
  validateGeofence(userLat, userLon, centerLat, centerLon, radiusMeters) {
    const distance = this.calculateDistance(userLat, userLon, centerLat, centerLon);

    return {
      isValid: distance <= radiusMeters,
      distance: Math.round(distance),
      radius: radiusMeters,
      message: distance <= radiusMeters
        ? `Within allowed area (${Math.round(distance)}m from centre)`
        : `Too far from session location (${Math.round(distance)}m, max: ${radiusMeters}m)`
    };
  },

  /**
   * Check / request location permission.
   * @returns {Promise<{granted: boolean, prompt?: boolean, denied?: boolean}>}
   */
  async requestPermission() {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return {
        granted: result.state === 'granted',
        prompt: result.state === 'prompt',
        denied: result.state === 'denied'
      };
    } catch {
      try {
        await this.getCurrentPosition();
        return { granted: true };
      } catch {
        return { granted: false, denied: true };
      }
    }
  }
};


// ============================================================
// RealtimeModule — Live Supabase Subscriptions
// ============================================================

const RealtimeModule = {
  channels: {},

  /**
   * Receive notifications when a session relevant to the student starts.
   * @param {string} studentId
   * @param {Function} onSessionStart  - Called with new session_notification payload
   * @returns {object} Supabase channel
   */
  subscribeToActiveSessions(studentId, onSessionStart) {
    const channel = supabase
      .channel(`student-sessions:${studentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_notifications',
        filter: `student_id=eq.${studentId}`
      }, (payload) => {
        console.log('New notification:', payload);
        if (payload.new.notification_type === 'session_started') {
          onSessionStart(payload.new);
        }
      })
      .subscribe();

    this.channels[`sessions:${studentId}`] = channel;
    return channel;
  },

  /**
   * Receive updates when the student's own attendance log row changes (e.g. approved).
   * @param {string} studentId
   * @param {Function} onUpdate  - Called with updated payload
   * @returns {object} Supabase channel
   */
  subscribeToAttendanceUpdates(studentId, onUpdate) {
    const channel = supabase
      .channel(`student-attendance:${studentId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'attendance_logs',
        filter: `student_id=eq.${studentId}`
      }, (payload) => {
        console.log('Attendance update:', payload);
        onUpdate(payload);
      })
      .subscribe();

    this.channels[`attendance:${studentId}`] = channel;
    return channel;
  },

  /**
   * Unsubscribe from all active channels.
   * @returns {Promise<void>}
   */
  async unsubscribeAll() {
    for (const key of Object.keys(this.channels)) {
      await supabase.removeChannel(this.channels[key]);
    }
    this.channels = {};
  }
};


// ============================================================
// ErrorHandler — Centralised Error Messages
// ============================================================

const ErrorHandler = {
  messages: {
    'INVALID_SESSION':       'The session code is invalid or has expired.',
    'SESSION_EXPIRED':       'This attendance session has ended.',
    'ALREADY_CHECKED_IN':    'You have already checked in for this session.',
    'DEVICE_MISMATCH':       'Your device does not match the registered device.',
    'GPS_UNAVAILABLE':       'Unable to get your location. Please enable GPS.',
    'GPS_PERMISSION_DENIED': 'Location permission denied. Please allow location access.',
    'NOT_ENROLLED':          'You are not enrolled in this course.',
    'NETWORK_ERROR':         'Network error. Please check your internet connection.',
    'AUTH_FAILED':           'Authentication failed. Please try again.',
    'UNKNOWN_ERROR':         'An unexpected error occurred. Please try again.'
  },

  /**
   * Show a user-friendly toast for an error and return a standard error object.
   * @param {object} error  - Error object with .code or .message
   * @param {boolean} [toast=true]
   * @returns {{success: false, code: string, message: string}}
   */
  handle(error, toast = true) {
    console.error('Error:', error);

    const code = error.code || error.message || 'UNKNOWN_ERROR';
    const message = this.messages[code] || this.messages.UNKNOWN_ERROR;

    if (toast) showToast(message, 'error');

    return { success: false, code, message };
  },

  /**
   * Handle Supabase or fetch API errors with appropriate messaging.
   * @param {object} error
   * @returns {{success: false, code: string, message: string}}
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


// ============================================================
// bindDevice — Onboarding Step 3 UI Flow
// ============================================================

/**
 * Full device binding flow triggered by the "Secure My Device" button.
 * Updates the DOM elements defined in onboarding.html Step 3.
 * @param {string} studentId
 * @returns {Promise<{success: boolean, deviceId?: string, isPrimary?: boolean, error?: string}>}
 */
async function bindDevice(studentId) {
  const bindBtn      = document.getElementById('bindDeviceBtn');
  const statusEl     = document.getElementById('bindingStatus');
  const animationEl  = document.getElementById('securityAnimation');

  if (bindBtn) {
    bindBtn.disabled = true;
    bindBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      Processing...
    `;
  }

  if (statusEl) statusEl.innerHTML = '<p class="status-text scanning">Scanning device characteristics...</p>';
  if (animationEl) animationEl.classList.add('scanning');

  try {
    const fpResult = await FingerprintModule.generate();
    if (!fpResult.success) throw new Error(fpResult.error || 'Failed to generate fingerprint');

    if (statusEl) statusEl.innerHTML = '<p class="status-text">Registering device...</p>';

    const deviceInfo = FingerprintModule.getDeviceInfo();
    const result = await DeviceAPI.registerDevice(studentId, 'student', deviceInfo);

    if (!result.success) throw new Error(result.error || 'Failed to register device');

    // Show device preview panel
    const previewEl = document.getElementById('devicePreview');
    if (previewEl) {
      previewEl.classList.remove('hidden');
      document.getElementById('deviceName').textContent    = deviceInfo.name;
      document.getElementById('deviceBrowser').textContent = deviceInfo.browser;
      document.getElementById('deviceOS').textContent      = deviceInfo.os;
    }

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
    return { success: true, deviceId: result.deviceId, isPrimary: result.isPrimary };

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
    return { success: false, error: error.message };
  }
}
