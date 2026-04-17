/**
 * ============================================================
 * LECTURER FUNCTIONS - Attendly Attendance Management System
 * ============================================================
 * Source: Lecturer-App_build.md
 * Depends on: supabase (global), localStorage
 *
 * MODULES:
 *  - LecturerAuth   → Login, session management, sign-out
 *  - LecturerAPI    → Courses, schedule, stats, records
 *  - SessionAPI     → Create, manage, and close attendance sessions
 *  - AttendanceAPI  → Pending approvals, manual add (referenced in HTML)
 *  - RoomAPI        → Room listing (referenced in HTML)
 *  - RealtimeManager → Live subscriptions for session & approval events
 *  - ExportUtils    → Export attendance records to CSV
 *  - showToast()    → Global UI toast notification helper
 * ============================================================
 */


// ============================================================
// LecturerAuth — Authentication & Session Storage
// ============================================================

const LecturerAuth = {
  /**
   * Authenticate a lecturer using staff ID, password, and initials.
   * @param {string} staffId
   * @param {string} password
   * @param {string} initials  - 1-3 uppercase letters
   * @returns {Promise<{success: boolean, needsInitialsConfirmation?: boolean, session?: object, error?: string}>}
   */
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

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: password
      });

      if (authError) {
        return { success: false, error: 'Invalid credentials' };
      }

      // First-time login: initials not yet set
      if (!data.initials) {
        return {
          success: true,
          needsInitialsConfirmation: true,
          session: { lecturer: data, session: authData }
        };
      }

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

  /**
   * Retrieve the currently logged-in lecturer from localStorage.
   * @returns {Promise<object|null>} Lecturer object or null
   */
  async getCurrentLecturer() {
    const session = localStorage.getItem('lecturerSession');
    return session ? JSON.parse(session) : null;
  },

  /**
   * Confirm and save a lecturer's initials after first login.
   * @param {string} lecturerId
   * @param {string} initials   - 1-3 uppercase letters
   * @param {object} tempSession - Temporary session from loginLecturer
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async confirmInitials(lecturerId, initials, tempSession) {
    try {
      const { error } = await supabase
        .from('lecturers')
        .update({ initials: initials.toUpperCase() })
        .eq('id', lecturerId);

      if (error) {
        return { success: false, error: 'Failed to save initials' };
      }

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

  /**
   * Sign out the current lecturer and clear local session.
   * @returns {Promise<void>}
   */
  async signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem('lecturerSession');
  }
};


// ============================================================
// LecturerAPI — Courses, Schedule, Stats, Records
// ============================================================

const LecturerAPI = {
  /**
   * Get all courses assigned to a lecturer.
   * @param {string} lecturerId
   * @returns {Promise<Array<{id, code, name, enrolled_count}>>}
   */
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

  /**
   * Get today's scheduled classes for a lecturer.
   * @param {string} lecturerId
   * @returns {Promise<Array>}
   */
  async getTodaySchedule(lecturerId) {
    const dayOfWeek = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

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

  /**
   * Get weekly attendance statistics for a lecturer.
   * @param {string} lecturerId
   * @returns {Promise<{totalSessions: number, totalAttendance: number, avgAttendanceRate: number}>}
   */
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
    const totalAttendance = sessions.reduce(
      (sum, s) => sum + (s.attendance_logs?.[0]?.count || 0), 0
    );

    return {
      totalSessions,
      totalAttendance,
      avgAttendanceRate: totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0
    };
  },

  /**
   * Check if a set of initials is already taken by another lecturer.
   * @param {string} initials
   * @param {string} excludeLecturerId - Exclude self from the check
   * @returns {Promise<boolean>}
   */
  async checkInitialsTaken(initials, excludeLecturerId) {
    const { data, error } = await supabase
      .from('lecturers')
      .select('id')
      .eq('initials', initials)
      .neq('id', excludeLecturerId)
      .limit(1);

    return data && data.length > 0;
  },

  /**
   * Get paginated attendance records for a lecturer with optional filters.
   * @param {object} params
   * @param {string} params.lecturerId
   * @param {string|null} params.courseId
   * @param {string|null} params.dateFrom  - ISO date string
   * @param {string|null} params.dateTo    - ISO date string
   * @param {number} params.page
   * @param {number} params.pageSize
   * @returns {Promise<{records: Array, summary: object, totalPages: number}>}
   */
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

    if (courseId) query = query.eq('course_id', courseId);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo)   query = query.lte('created_at', dateTo);

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
      attendance_rate: 0  // Calculate as needed
    }));

    return {
      records,
      summary: {
        totalSessions: count,
        totalAttendance: records.reduce((sum, r) => sum + r.attendance_count, 0),
        avgAttendanceRate: 75  // Replace with real calculation if available
      },
      totalPages: Math.ceil(count / pageSize)
    };
  },

  /**
   * Get all attendance records (unpaginated) for export.
   * @param {object} params - { lecturerId, courseId?, dateFrom?, dateTo? }
   * @returns {Promise<Array>}
   */
  async getAllAttendanceRecords({ lecturerId, courseId, dateFrom, dateTo }) {
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
      `)
      .eq('lecturer_id', lecturerId)
      .order('created_at', { ascending: false });

    if (courseId) query = query.eq('course_id', courseId);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo)   query = query.lte('created_at', dateTo);

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }
};


// ============================================================
// SessionAPI — Create and Manage Attendance Sessions
// ============================================================

const SessionAPI = {
  /**
   * Create a new attendance session.
   * @param {object} params
   * @param {string} params.courseId
   * @param {string} params.roomId
   * @param {number} params.duration       - Duration in minutes
   * @param {string} [params.sessionType]  - Defaults to 'regular'
   * @param {boolean} params.gpsRequired
   * @returns {Promise<{success: boolean, session?: object, error?: string}>}
   */
  async createSession({ courseId, roomId, duration, sessionType, gpsRequired }) {
    const lecturer = await LecturerAuth.getCurrentLecturer();
    if (!lecturer) return { success: false, error: 'Not authenticated' };

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

    if (error) return { success: false, error: 'Failed to create session' };
    return { success: true, session: data };
  },

  /**
   * Generate a unique session code using lecturer initials + 4 random digits.
   * Retries until the code doesn't exist in the database.
   * @param {string} initials
   * @returns {Promise<string>}
   */
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

  /**
   * Get all active (non-expired) sessions for a lecturer.
   * @param {string} lecturerId
   * @returns {Promise<Array<{id, session_code, expires_at, course_code, course_name, room_name, attendance_count}>>}
   */
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

  /**
   * Fetch a single session by ID, including course and room info.
   * @param {string} sessionId
   * @returns {Promise<object|null>}
   */
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

  /**
   * Get all attendance log entries for a session.
   * @param {string} sessionId
   * @returns {Promise<Array<{id, check_in_time, status, student_name, matric_number}>>}
   */
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

  /**
   * Extend a session's expiry time by a given number of minutes.
   * @param {string} sessionId
   * @param {number} additionalMinutes
   * @returns {Promise<{success: boolean}>}
   */
  async extendSession(sessionId, additionalMinutes) {
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

  /**
   * End an active session immediately.
   * @param {string} sessionId
   * @returns {Promise<{success: boolean}>}
   */
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

  /**
   * Shortcut: create a session with default settings (10 min, GPS on).
   * @param {string} courseId
   * @param {string} roomId
   * @returns {Promise<{success: boolean, session?: object, error?: string}>}
   */
  async quickCreate(courseId, roomId) {
    return this.createSession({
      courseId,
      roomId,
      duration: 10,
      gpsRequired: true
    });
  }
};


// ============================================================
// AttendanceAPI — Approvals and Manual Attendance
// (Methods are referenced from the HTML pages)
// ============================================================

const AttendanceAPI = {
  /**
   * Get all pending device-mismatch approval requests for a lecturer.
   * @param {string} lecturerId
   * @returns {Promise<Array>}
   */
  async getPendingApprovals(lecturerId) {
    const { data, error } = await supabase
      .from('device_mismatch_approvals')
      .select('*')
      .eq('lecturer_id', lecturerId)
      .eq('status', 'pending')
      .order('request_time', { ascending: false });

    if (error) return [];
    return data || [];
  },

  /**
   * Get count of pending approvals for a lecturer.
   * @param {string} lecturerId
   * @returns {Promise<number>}
   */
  async getPendingApprovalsCount(lecturerId) {
    const { count, error } = await supabase
      .from('device_mismatch_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('lecturer_id', lecturerId)
      .eq('status', 'pending');

    if (error) return 0;
    return count || 0;
  },

  /**
   * Approve or reject a device mismatch attendance request.
   * @param {object} params
   * @param {string} params.requestId
   * @param {boolean} params.approved
   * @param {string|null} params.reason   - Required if rejecting
   * @param {string} params.lecturerId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async processDeviceMismatchApproval({ requestId, approved, reason, lecturerId }) {
    const { error } = await supabase
      .from('device_mismatch_approvals')
      .update({
        status: approved ? 'approved' : 'rejected',
        rejection_reason: reason || null,
        reviewed_by: lecturerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Manually add a student to an active session.
   * @param {object} params
   * @param {string} params.sessionId
   * @param {string} params.studentId
   * @param {string} params.reason      - 'technical' | 'device' | 'network' | 'other'
   * @param {string} params.notes
   * @param {string} params.lecturerId
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async manualAddStudent({ sessionId, studentId, reason, notes, lecturerId }) {
    const { error } = await supabase
      .from('attendance_logs')
      .insert({
        session_id: sessionId,
        student_id: studentId,
        check_in_time: new Date().toISOString(),
        status: 'manual',
        manual_reason: reason,
        manual_notes: notes,
        added_by: lecturerId
      });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
};


// ============================================================
// RoomAPI — Room Listing
// ============================================================

const RoomAPI = {
  /**
   * Get all available rooms.
   * @returns {Promise<Array<{id, name, building}>>}
   */
  async getAllRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('id, name, building')
      .order('name');

    if (error) return [];
    return data || [];
  }
};


// ============================================================
// StudentAPI — Student Search (used by manual-attendance.html)
// ============================================================

const StudentAPI = {
  /**
   * Search students by name or matric number.
   * @param {string} query  - Minimum 2 characters
   * @returns {Promise<Array<{id, full_name, matric_number}>>}
   */
  async searchStudents(query) {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, matric_number')
      .or(`full_name.ilike.%${query}%,matric_number.ilike.%${query}%`)
      .limit(10);

    if (error) return [];
    return data || [];
  }
};


// ============================================================
// RealtimeManager — Live Supabase Subscriptions
// ============================================================

const RealtimeManager = {
  subscriptions: [],

  /**
   * Subscribe to live attendance and session updates for a session.
   * @param {string} sessionId
   * @param {object} callbacks
   * @param {Function} callbacks.onNewAttendance  - Called with new attendance record
   * @param {Function} callbacks.onSessionUpdate  - Called when session row is updated
   * @returns {Promise<object>} Supabase channel
   */
  async subscribeToSession(sessionId, callbacks) {
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance_logs',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        if (callbacks.onNewAttendance) callbacks.onNewAttendance(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'attendance_sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        if (callbacks.onSessionUpdate) callbacks.onSessionUpdate(payload.new);
      })
      .subscribe();

    this.subscriptions.push(channel);
    return channel;
  },

  /**
   * Subscribe to any attendance changes linked to a lecturer.
   * @param {string} lecturerId
   * @param {object} callbacks
   * @param {Function} callbacks.onAttendanceUpdate
   * @returns {Promise<object>} Supabase channel
   */
  async subscribeToLecturerUpdates(lecturerId, callbacks) {
    const channel = supabase
      .channel(`lecturer:${lecturerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance_logs',
        filter: `lecturer_id=eq.${lecturerId}`
      }, (payload) => {
        if (callbacks.onAttendanceUpdate) callbacks.onAttendanceUpdate(payload.new);
      })
      .subscribe();

    this.subscriptions.push(channel);
    return channel;
  },

  /**
   * Subscribe to incoming device mismatch approval requests.
   * @param {string} lecturerId
   * @param {Function} callback  - Called with new request payload
   * @returns {Promise<object>} Supabase channel
   */
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

  /**
   * Unsubscribe and remove all active realtime channels.
   */
  unsubscribeAll() {
    this.subscriptions.forEach(sub => supabase.removeChannel(sub));
    this.subscriptions = [];
  }
};


// ============================================================
// ExportUtils — Export Attendance Data
// ============================================================

const ExportUtils = {
  /**
   * Download an array of records as a CSV file.
   * @param {Array<object>} records
   * @param {string} filename  - e.g. 'attendance_records.csv'
   */
  toCsv(records, filename = 'export.csv') {
    if (!records || records.length === 0) return;

    const headers = Object.keys(records[0]);
    const rows = records.map(r =>
      headers.map(h => JSON.stringify(r[h] ?? '')).join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};


// ============================================================
// showToast — Global UI Notification Helper
// ============================================================

/**
 * Display a transient toast notification.
 * Requires a <div id="toastContainer"> in the page HTML.
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} type
 * @param {number} [duration=3000]  - Auto-dismiss delay in ms
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}
