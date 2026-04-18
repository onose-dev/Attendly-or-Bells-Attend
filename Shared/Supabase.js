/**
 * =============================================
 * UNIVERSITY ATTENDANCE MANAGEMENT SYSTEM
 * Supabase Client Library
 * Version: 1.0.0
 * =============================================
 * 
 * This file contains all Supabase client-side functions
 * for the University Attendance Management PWA.
 * 
 * TABLE OF CONTENTS:
 * 1. Configuration & Initialization
 * 2. Authentication Functions
 * 3. Student Functions
 * 4. Lecturer Functions
 * 5. Course Functions
 * 6. Enrollment Functions
 * 7. Device Registry Functions (FINGERPRINTING)
 * 8. Attendance Session Functions
 * 9. Attendance Log Functions
 * 10. Notification Functions
 * 11. Realtime Subscriptions
 * 12. Utility Functions
 * 13. Export Functions
 */

// =============================================
// SECTION 1: CONFIGURATION & INITIALIZATION
// =============================================

/**
 * SUPABASE CONFIGURATION
 * 
 * To set up Supabase:
 * 1. Go to https://supabase.com and create a new project
 * 2. Navigate to Project Settings > API
 * 3. Copy the Project URL and anon/public key
 * 
 * SECURITY BEST PRACTICES:
 * - Never commit the service_role key to version control
 * - Use environment variables in production
 * - The anon key is safe for client-side use with RLS enabled
 * - Always enable Row Level Security on all tables
 */

// Configuration object - Replace with your actual values
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_PROJECT_URL', // e.g., 'https://xyzcompany.supabase.co'
    anonKey: 'YOUR_SUPABASE_ANON_KEY', // Your anon/public key
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: 'attendly_auth_token'
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        },
        global: {
            headers: {
                'x-app-version': '1.0.0'
            }
        }
    }
};

// Initialize Supabase client
let supabase;

/**
 * Initialize the Supabase client
 * Must be called before any other functions
 * @returns {Object} Supabase client instance
 */
function initializeSupabase() {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            SUPABASE_CONFIG.options
        );
        console.log('✅ Supabase client initialized');
        return supabase;
    } else {
        console.error('❌ Supabase library not loaded');
        return null;
    }
}

// =============================================
// SECTION 2: AUTHENTICATION FUNCTIONS
// =============================================

/**
 * Authentication namespace containing all auth-related functions
 */
const Auth = {
    
    /**
     * Sign in a student with matric number
     * @param {string} matricNumber - Student's matric number
     * @param {string} fullName - Student's full name (for verification)
     * @returns {Promise<Object>} Authentication result
     */
    async loginStudent(matricNumber, fullName) {
        try {
            // First, check if student exists in database
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('matric_number', matricNumber)
                .eq('is_active', true)
                .single();

            if (studentError && studentError.code === 'PGRST116') {
                // Student not found - create new student record
                const { data: newStudent, error: createError } = await supabase
                    .from('students')
                    .insert({
                        matric_number: matricNumber,
                        full_name: fullName,
                        is_active: true,
                        is_onboarded: false
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                
                return {
                    success: true,
                    isNewUser: true,
                    user: newStudent,
                    message: 'New student account created. Please complete onboarding.'
                };
            }

            if (studentError) throw studentError;

            // Verify name matches (case-insensitive partial match)
            const nameMatch = student.full_name.toLowerCase().includes(fullName.toLowerCase()) ||
            fullName.toLowerCase().includes(student.full_name.toLowerCase());

            if (!nameMatch) {
                return {
                    success: false,
                    error: 'Name does not match our records',
                    code: 'NAME_MISMATCH'
                };
            }

            // Update last login timestamp
            await supabase
                .from('students')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', student.id);

            return {
                success: true,
                isNewUser: !student.is_onboarded,
                user: student,
                message: student.is_onboarded ? 'Login successful' : 'Please complete onboarding'
            };

        } catch (error) {
            console.error('Student login error:', error);
            return {
                success: false,
                error: error.message || 'Login failed',
                code: error.code || 'LOGIN_ERROR'
            };
        }
    },

    /**
     * Sign in a lecturer with lecturer ID
     * @param {string} lecturerId - Lecturer's unique ID
     * @param {string} fullName - Lecturer's full name
     * @returns {Promise<Object>} Authentication result
     */
    async loginLecturer(lecturerId, fullName) {
        try {
            const { data: lecturer, error: lecturerError } = await supabase
                .from('lecturers')
                .select('*')
                .eq('lecturer_id', lecturerId)
                .eq('is_active', true)
                .single();

            if (lecturerError && lecturerError.code === 'PGRST116') {
                // Lecturer not found - create new record
                // Generate initials from name
                const nameParts = fullName.trim().split(/\s+/);
                const initials = nameParts.length >= 2 
                    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                    : nameParts[0].substring(0, 2).toUpperCase();

                const { data: newLecturer, error: createError } = await supabase
                    .from('lecturers')
                    .insert({
                        lecturer_id: lecturerId,
                        full_name: fullName,
                        initials: initials,
                        is_active: true,
                        is_onboarded: false
                    })
                    .select()
                    .single();

                if (createError) throw createError;

                return {
                    success: true,
                    isNewUser: true,
                    needsInitialsConfirmation: true,
                    suggestedInitials: initials,
                    user: newLecturer,
                    message: 'New lecturer account created. Please confirm your initials.'
                };
            }

            if (lecturerError) throw lecturerError;

            // Update last login
            await supabase
                .from('lecturers')
                .update({ 
                    last_login_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', lecturer.id);

            return {
                success: true,
                isNewUser: !lecturer.is_onboarded,
                needsInitialsConfirmation: false,
                user: lecturer,
                message: 'Login successful'
            };

        } catch (error) {
            console.error('Lecturer login error:', error);
            return {
                success: false,
                error: error.message || 'Login failed',
                code: error.code || 'LOGIN_ERROR'
            };
        }
    },

    /**
     * Confirm or update lecturer initials
     * @param {string} lecturerId - Lecturer's UUID
     * @param {string} initials - Confirmed initials (2-5 characters)
     * @returns {Promise<Object>} Update result
     */
    async confirmInitials(lecturerId, initials) {
        try {
            const { data, error } = await supabase
                .from('lecturers')
                .update({ 
                    initials: initials.toUpperCase(),
                    is_onboarded: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', lecturerId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                user: data,
                message: 'Initials confirmed successfully'
            };

        } catch (error) {
            console.error('Confirm initials error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Get current user session
     * @returns {Object|null} Current user data or null
     */
    getCurrentUser() {
        try {
            const stored = localStorage.getItem('attendly_current_user');
            if (stored) {
                return JSON.parse(stored);
            }
            return null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    /**
     * Store user session
     * @param {Object} user - User data to store
     * @param {string} type - 'student' or 'lecturer'
     */
    setCurrentUser(user, type) {
        const sessionData = {
            ...user,
            userType: type,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('attendly_current_user', JSON.stringify(sessionData));
    },

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            localStorage.removeItem('attendly_current_user');
            localStorage.removeItem('attendly_auth_token');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }
};

// =============================================
// SECTION 3: STUDENT FUNCTIONS
// =============================================

const StudentAPI = {

    /**
     * Get student profile by ID
     * @param {string} studentId - Student's UUID
     * @returns {Promise<Object>} Student profile data
     */
    async getProfile(studentId) {
        try {
            const { data, error } = await supabase
                .from('students')
                .select(`
                    *,
                    college:colleges(id, name, code),
                    department:departments(id, name, code)
                `)
                .eq('id', studentId)
                .single();

            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error('Get student profile error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update student profile
     * @param {string} studentId - Student's UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Update result
     */
    async updateProfile(studentId, updates) {
        try {
            const allowedFields = ['full_name', 'email', 'phone', 'college_id', 'department_id', 'level'];
            const filteredUpdates = {};
            
            for (const key of allowedFields) {
                if (updates[key] !== undefined) {
                    filteredUpdates[key] = updates[key];
                }
            }

            const { data, error } = await supabase
                .from('students')
                .update(filteredUpdates)
                .eq('id', studentId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error('Update student profile error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Complete student onboarding
     * @param {string} studentId - Student's UUID
     * @param {Object} onboardingData - Onboarding information
     * @returns {Promise<Object>} Onboarding result
     */
    async completeOnboarding(studentId, onboardingData) {
        try {
            const { collegeId, departmentId, level, courseIds } = onboardingData;

            // Update student profile
            const { error: updateError } = await supabase
                .from('students')
                .update({
                    college_id: collegeId,
                    department_id: departmentId,
                    level: level,
                    is_onboarded: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', studentId);

            if (updateError) throw updateError;

            // Enroll in selected courses
            if (courseIds && courseIds.length > 0) {
                const enrollments = courseIds.map(courseId => ({
                    student_id: studentId,
                    course_id: courseId,
                    enrollment_type: 'Regular',
                    is_active: true
                }));

                const { error: enrollmentError } = await supabase
                    .from('enrollments')
                    .insert(enrollments);

                if (enrollmentError) throw enrollmentError;
            }

            return {
                success: true,
                message: 'Onboarding completed successfully'
            };

        } catch (error) {
            console.error('Complete onboarding error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get student's enrolled courses with attendance stats
     * @param {string} studentId - Student's UUID
     * @returns {Promise<Object>} List of courses with attendance percentages
     */
    async getMyCourses(studentId) {
        try {
            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    enrollment_type,
                    enrolled_at,
                    course:courses(
                        id,
                        course_code,
                        course_name,
                        credit_units,
                        semester,
                        session,
                        level,
                        course_lecturers(
                            initials,
                            is_primary,
                            lecturer:lecturers(id, full_name)
                        )
                    )
                `)
                .eq('student_id', studentId)
                .eq('is_active', true);

            if (error) throw error;

            // Calculate attendance percentage for each course
            const coursesWithStats = await Promise.all(
                enrollments.map(async (enrollment) => {
                    const percentage = await this.calculateAttendancePercentage(
                        studentId, 
                        enrollment.course.id
                    );
                    return {
                        ...enrollment,
                        attendancePercentage: percentage
                    };
                })
            );

            return { success: true, data: coursesWithStats };

        } catch (error) {
            console.error('Get my courses error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Calculate attendance percentage for a student in a course
     * @param {string} studentId - Student's UUID
     * @param {string} courseId - Course's UUID
     * @returns {Promise<number>} Attendance percentage
     */
    async calculateAttendancePercentage(studentId, courseId) {
        try {
            // Get total sessions (excluding no-class)
            const { data: sessions, error: sessionsError } = await supabase
                .from('attendance_sessions')
                .select('id')
                .eq('course_id', courseId)
                .eq('status', 'ended')
                .eq('is_no_class', false);

            if (sessionsError) throw sessionsError;

            const totalSessions = sessions?.length || 0;
            
            if (totalSessions === 0) return 0;

            // Get attended sessions
            const { data: logs, error: logsError } = await supabase
                .from('attendance_logs')
                .select('session_id')
                .eq('student_id', studentId)
                .eq('status', 'present');

            if (logsError) throw logsError;

            const attendedSessions = new Set(logs?.map(l => l.session_id)).size;
            
            return Math.round((attendedSessions / totalSessions) * 100);

        } catch (error) {
            console.error('Calculate attendance error:', error);
            return 0;
        }
    }
};

// =============================================
// SECTION 4: LECTURER FUNCTIONS
// =============================================

const LecturerAPI = {

    /**
     * Get lecturer profile by ID
     * @param {string} lecturerId - Lecturer's UUID
     * @returns {Promise<Object>} Lecturer profile data
     */
    async getProfile(lecturerId) {
        try {
            const { data, error } = await supabase
                .from('lecturers')
                .select(`
                    *,
                    college:colleges(id, name, code),
                    department:departments(id, name, code)
                `)
                .eq('id', lecturerId)
                .single();

            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error('Get lecturer profile error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get courses assigned to lecturer
     * @param {string} lecturerId - Lecturer's UUID
     * @returns {Promise<Object>} List of assigned courses
     */
    async getMyCourses(lecturerId) {
        try {
            const { data, error } = await supabase
                .from('course_lecturers')
                .select(`
                    id,
                    initials,
                    is_primary,
                    assigned_at,
                    course:courses(
                        id,
                        course_code,
                        course_name,
                        credit_units,
                        semester,
                        session,
                        level,
                        department:departments(id, name, code)
                    ),
                    other_lecturers:course_lecturers(
                        initials,
                        is_primary,
                        lecturer:lecturers(id, full_name)
                    )
                `)
                .eq('lecturer_id', lecturerId);

            if (error) throw error;

            // Process to separate other lecturers
            const processedData = data.map(item => {
                const others = item.other_lecturers
                    .filter(ol => ol.lecturer?.id !== lecturerId)
                    .map(ol => ({
                        initials: ol.initials,
                        name: ol.lecturer?.full_name,
                        isPrimary: ol.is_primary
                    }));

                return {
                    ...item,
                    otherLecturers: others
                };
            });

            return { success: true, data: processedData };

        } catch (error) {
            console.error('Get lecturer courses error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update lecturer initials
     * @param {string} lecturerId - Lecturer's UUID
     * @param {string} initials - New initials
     * @returns {Promise<Object>} Update result
     */
    async updateInitials(lecturerId, initials) {
        try {
            // Update lecturer's main initials
            const { error: lecturerError } = await supabase
                .from('lecturers')
                .update({ 
                    initials: initials.toUpperCase(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', lecturerId);

            if (lecturerError) throw lecturerError;

            // Update initials in course_lecturers
            const { error: courseLecturersError } = await supabase
                .from('course_lecturers')
                .update({ initials: initials.toUpperCase() })
                .eq('lecturer_id', lecturerId);

            if (courseLecturersError) throw courseLecturersError;

            return { success: true, message: 'Initials updated successfully' };

        } catch (error) {
            console.error('Update initials error:', error);
            return { success: false, error: error.message };
        }
    }
};

// =============================================
// SECTION 5: COURSE FUNCTIONS
// =============================================

const CourseAPI = {

    /**
     * Get all active courses (for enrollment selection)
     * @param {Object} filters - Optional filters (level, department, semester)
     * @returns {Promise<Object>} List of courses
     */
    async getAllCourses(filters = {}) {
        try {
            let query = supabase
                .from('courses')
                .select(`
                    id,
                    course_code,
                    course_name,
                    credit_units,
                    semester,
                    session,
                    level,
                    department:departments(id, name, code),
                    course_lecturers(
                        initials,
                        lecturer:lecturers(full_name)
                    )
                `)
                .eq('is_active', true)
                .order('level', { ascending: true })
                .order('course_code', { ascending: true });

            if (filters.level) {
                query = query.eq('level', filters.level);
            }
            if (filters.departmentId) {
                query = query.eq('department_id', filters.departmentId);
            }
            if (filters.semester) {
                query = query.eq('semester', filters.semester);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error('Get all courses error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Search courses by code or name
     * @param {string} searchTerm - Search query
     * @returns {Promise<Object>} Matching courses
     */
    async searchCourses(searchTerm) {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select(`
                    id,
                    course_code,
                    course_name,
                    credit_units,
                    level,
                    semester,
                    department:departments(id, name, code)
                `)
                .or(`course_code.ilike.%${searchTerm}%,course_name.ilike.%${searchTerm}%`)
                .eq('is_active', true)
                .limit(20);

            if (error) throw error;
            return { success: true, data };

        } catch (error) {
            console.error('Search courses error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get course details with enrolled students count
     * @param {string} courseId - Course UUID
     * @returns {Promise<Object>} Course details
     */
    async getCourseDetails(courseId) {
        try {
            const { data: course, error: courseError } = await supabase
                .from('courses')
                .select(`
                    *,
                    department:departments(id, name, code),
                    college:colleges(id, name, code)
                `)
                .eq('id', courseId)
                .single();

            if (courseError) throw courseError;

            // Get enrolled students count
            const { count, error: countError } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', courseId)
                .eq('is_active', true);

            if (countError) throw countError;

            return {
                success: true,
                data: {
                    ...course,
                    enrolledCount: count || 0
                }
            };

        } catch (error) {
            console.error('Get course details error:', error);
            return { success: false, error: error.message };
        }
    }
};

// =============================================
// SECTION 6: ENROLLMENT FUNCTIONS
// =============================================

const EnrollmentAPI = {

    /**
     * Enroll student in a course
     * @param {string} studentId - Student's UUID
     * @param {string} courseId - Course's UUID
     * @param {string} type - Enrollment type ('Regular', 'Carryover', 'Elective')
     * @returns {Promise<Object>} Enrollment result
     */
    async enrollInCourse(studentId, courseId, type = 'Regular') {
        try {
            const { data, error } = await supabase
                .from('enrollments')
                .insert({
                    student_id: studentId,
                    course_id: courseId,
                    enrollment_type: type,
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return { success: false, error: 'Already enrolled in this course' };
                }
                throw error;
            }

            return { success: true, data };

        } catch (error) {
            console.error('Enroll in course error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Unenroll student from a course
     * @param {string} studentId - Student's UUID
     * @param {string} courseId - Course's UUID
     * @returns {Promise<Object>} Unenrollment result
     */
    async unenrollFromCourse(studentId, courseId) {
        try {
            const { error } = await supabase
                .from('enrollments')
                .delete()
                .eq('student_id', studentId)
                .eq('course_id', courseId);

            if (error) throw error;

            return { success: true, message: 'Unenrolled successfully' };

        } catch (error) {
            console.error('Unenroll error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get enrolled students for a course (lecturer only)
     * @param {string} courseId - Course's UUID
     * @returns {Promise<Object>} List of enrolled students
     */
    async getEnrolledStudents(courseId) {
        try {
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    enrollment_type,
                    enrolled_at,
                    student:students(
                        id,
                        matric_number,
                        full_name,
                        level,
                        department:departments(id, name, code)
                    )
                `)
                .eq('course_id', courseId)
                .eq('is_active', true)
                .order('student(matric_number)', { ascending: true });

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get enrolled students error:', error);
            return { success: false, error: error.message };
        }
    }
};

// =============================================
// SECTION 7: DEVICE REGISTRY FUNCTIONS (FINGERPRINTING)
// =============================================

/**
 * DEVICE FINGERPRINTING IMPLEMENTATION
 * 
 * This section implements device binding using FingerprintJS.
 * 
 * HOW IT WORKS:
 * 1. On student onboarding (Step 3), FingerprintJS generates a unique visitorId
 * 2. This visitorId is stored in the device_registry table
 * 3. During check-in, the device fingerprint is compared against registered devices
 * 4. If mismatch, attendance is sent to pending approvals queue
 * 5. Lecturer can approve (updating device) or reject
 * 
 * SECURITY CONSIDERATIONS:
 * - FingerprintJS uses multiple signals (canvas, WebGL, fonts, etc.)
 * - It's probabilistic - same device should generate same fingerprint
 * - Can change with browser updates or different browsers
 * - Should be combined with other validation (GPS, timing)
 * 
 * ANTI-SPOOFING:
 * - Check confidence score from FingerprintJS
 * - Use extended fingerprinting options
 * - Monitor for rapid device changes
 * - Log all device-related activities
 */

const DeviceAPI = {

    /**
     * Initialize FingerprintJS and get visitor ID
     * @returns {Promise<Object>} Fingerprint result
     */
    async generateFingerprint() {
        try {
            // Load FingerprintJS if not already loaded
            if (typeof FingerprintJS === 'undefined') {
                await this.loadFingerprintJS();
            }

            const fp = await FingerprintJS.load({
                debug: false,
                // Extended detection for better accuracy
                excludes: {
                    // Exclude unstable components
                    enumerateDevices: true,
                    pixelRatio: true,
                    doNotTrack: true
                }
            });

            const result = await fp.get();
            
            console.log('🔍 Fingerprint generated:', {
                visitorId: result.visitorId,
                confidence: result.confidence,
                components: Object.keys(result.components)
            });

            return {
                success: true,
                fingerprint: result.visitorId,
                confidence: result.confidence,
                components: result.components
            };

        } catch (error) {
            console.error('Generate fingerprint error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Load FingerprintJS library dynamically
     * @returns {Promise<void>}
     */
    async loadFingerprintJS() {
        return new Promise((resolve, reject) => {
            if (typeof FingerprintJS !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://openfpcdn.io/fingerprintjs/v4';
            script.integrity = 'sha384-4Z0Vj5k5eE8d5eF5d5eE8d5eF5d5eE8d5eF5d5eE8d5eF5d5eE8d5eF5d5eE8d5eF5';
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
    },

    /**
     * Register a device for a user
     * @param {string} userId - User's UUID
     * @param {string} userType - 'student' or 'lecturer'
     * @param {Object} deviceInfo - Additional device information
     * @returns {Promise<Object>} Registration result
     */
    async registerDevice(userId, userType, deviceInfo = {}) {
        try {
            // Generate fingerprint
            const fpResult = await this.generateFingerprint();
            
            if (!fpResult.success) {
                throw new Error('Failed to generate device fingerprint');
            }

            // Check if device already registered
            const { data: existing, error: checkError } = await supabase
                .from('device_registry')
                .select('*')
                .eq('user_id', userId)
                .eq('user_type', userType)
                .eq('device_fingerprint', fpResult.fingerprint)
                .single();

            if (existing) {
                // Update last seen
                await supabase
                    .from('device_registry')
                    .update({ 
                        last_seen: new Date().toISOString(),
                        device_name: deviceInfo.name || this.getDeviceName(),
                        device_os: this.getOS(),
                        device_browser: this.getBrowser()
                    })
                    .eq('id', existing.id);

                return {
                    success: true,
                    isNewDevice: false,
                    deviceId: existing.id,
                    message: 'Device recognized'
                };
            }

            // Get device metadata
            const deviceData = {
                user_id: userId,
                user_type: userType,
                device_fingerprint: fpResult.fingerprint,
                device_name: deviceInfo.name || this.getDeviceName(),
                device_os: this.getOS(),
                device_browser: this.getBrowser(),
                user_agent: navigator.userAgent,
                is_verified: true, // Auto-verify on registration
                is_primary: false
            };

            // Check if this is the first device (make it primary)
            const { count } = await supabase
                .from('device_registry')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('user_type', userType);

            deviceData.is_primary = count === 0;

            const { data, error } = await supabase
                .from('device_registry')
                .insert(deviceData)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                isNewDevice: true,
                isPrimary: deviceData.is_primary,
                deviceId: data.id,
                message: deviceData.is_primary 
                    ? 'Primary device registered successfully' 
                    : 'New device registered'
            };

        } catch (error) {
            console.error('Register device error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Validate device during check-in
     * @param {string} userId - User's UUID
     * @param {string} userType - 'student' or 'lecturer'
     * @returns {Promise<Object>} Validation result
     */
    async validateDevice(userId, userType) {
        try {
            // Generate current fingerprint
            const fpResult = await this.generateFingerprint();
            
            if (!fpResult.success) {
                return {
                    isValid: false,
                    reason: 'fingerprint_generation_failed',
                    error: fpResult.error
                };
            }

            // Get registered primary device
            const { data: primaryDevice, error } = await supabase
                .from('device_registry')
                .select('*')
                .eq('user_id', userId)
                .eq('user_type', userType)
                .eq('is_primary', true)
                .eq('is_blocked', false)
                .single();

            if (error || !primaryDevice) {
                // No registered device - should register first
                return {
                    isValid: false,
                    needsRegistration: true,
                    reason: 'no_registered_device',
                    currentFingerprint: fpResult.fingerprint
                };
            }

            // Compare fingerprints
            const isMatch = primaryDevice.device_fingerprint === fpResult.fingerprint;

            if (isMatch) {
                // Update last seen
                await supabase
                    .from('device_registry')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', primaryDevice.id);

                return {
                    isValid: true,
                    deviceId: primaryDevice.id,
                    confidence: fpResult.confidence
                };
            }

            // Device mismatch - check if it's another registered device
            const { data: otherDevice } = await supabase
                .from('device_registry')
                .select('*')
                .eq('user_id', userId)
                .eq('user_type', userType)
                .eq('device_fingerprint', fpResult.fingerprint)
                .eq('is_blocked', false)
                .single();

            if (otherDevice) {
                // Known secondary device
                await supabase
                    .from('device_registry')
                    .update({ last_seen: new Date().toISOString() })
                    .eq('id', otherDevice.id);

                return {
                    isValid: true,
                    deviceId: otherDevice.id,
                    isPrimary: false,
                    confidence: fpResult.confidence
                };
            }

            // Unknown device - needs approval
            return {
                isValid: false,
                needsApproval: true,
                reason: 'device_mismatch',
                registeredDevice: {
                    id: primaryDevice.id,
                    name: primaryDevice.device_name,
                    os: primaryDevice.device_os
                },
                currentFingerprint: fpResult.fingerprint,
                currentDeviceInfo: {
                    name: this.getDeviceName(),
                    os: this.getOS(),
                    browser: this.getBrowser()
                }
            };

        } catch (error) {
            console.error('Validate device error:', error);
            return {
                isValid: false,
                reason: 'validation_error',
                error: error.message
            };
        }
    },

    /**
     * Get user's registered devices
     * @param {string} userId - User's UUID
     * @param {string} userType - 'student' or 'lecturer'
     * @returns {Promise<Object>} List of devices
     */
    async getMyDevices(userId, userType) {
        try {
            const { data, error } = await supabase
                .from('device_registry')
                .select('*')
                .eq('user_id', userId)
                .eq('user_type', userType)
                .order('is_primary', { ascending: false })
                .order('last_seen', { ascending: false });

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get devices error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update device after lecturer approval
     * @param {string} currentFingerprint - New fingerprint to register
     * @param {string} userId - User's UUID
     * @param {string} userType - 'student' or 'lecturer'
     * @param {string} approvedBy - Lecturer's UUID who approved
     * @returns {Promise<Object>} Update result
     */
    async updateDeviceAfterApproval(currentFingerprint, userId, userType, approvedBy) {
        try {
            // Mark old primary as non-primary
            await supabase
                .from('device_registry')
                .update({ is_primary: false })
                .eq('user_id', userId)
                .eq('user_type', userType)
                .eq('is_primary', true);

            // Register new device as primary
            const { data, error } = await supabase
                .from('device_registry')
                .insert({
                    user_id: userId,
                    user_type: userType,
                    device_fingerprint: currentFingerprint,
                    device_name: this.getDeviceName(),
                    device_os: this.getOS(),
                    device_browser: this.getBrowser(),
                    user_agent: navigator.userAgent,
                    is_verified: true,
                    is_primary: true,
                    verified_by: approvedBy,
                    verified_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data,
                message: 'Device updated successfully'
            };

        } catch (error) {
            console.error('Update device error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get device name from user agent
     * @returns {string} Device name
     */
    getDeviceName() {
        const ua = navigator.userAgent;
        
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

    /**
     * Get OS from user agent
     * @returns {string} Operating system
     */
    getOS() {
        const ua = navigator.userAgent;
        
        if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
        if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
        if (/Windows NT 6\.2/.test(ua)) return 'Windows 8';
        if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
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

    /**
     * Get browser from user agent
     * @returns {string} Browser name
     */
    getBrowser() {
        const ua = navigator.userAgent;
        
        if (/Edg/.test(ua)) return 'Edge';
        if (/OPR|Opera/.test(ua)) return 'Opera';
        if (/Chrome/.test(ua)) return 'Chrome';
        if (/Firefox/.test(ua)) return 'Firefox';
        if (/Safari/.test(ua)) return 'Safari';
        
        return 'Unknown Browser';
    }
};

// =============================================
// SECTION 8: ATTENDANCE SESSION FUNCTIONS
// =============================================

const SessionAPI = {

    /**
     * Create a new attendance session
     * @param {Object} sessionData - Session details
     * @returns {Promise<Object>} Created session
     */
    async createSession(sessionData) {
        try {
            const { courseId, roomId, lecturerId, durationMinutes = 20 } = sessionData;

            // Get room details for GPS coordinates
            const { data: room, error: roomError } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single();

            if (roomError) throw roomError;

            // Generate unique session code
            const sessionCode = await this.generateUniqueCode();

            const now = new Date();
            const expiresAt = new Date(now.getTime() + durationMinutes * 60000);

            const { data, error } = await supabase
                .from('attendance_sessions')
                .insert({
                    course_id: courseId,
                    lecturer_id: lecturerId,
                    room_id: roomId,
                    session_code: sessionCode,
                    expires_at: expiresAt.toISOString(),
                    latitude: room.latitude,
                    longitude: room.longitude,
                    radius_meters: room.radius_meters,
                    status: 'active'
                })
                .select(`
                    *,
                    course:courses(id, course_code, course_name),
                    room:rooms(id, room_code, room_name)
                `)
                .single();

            if (error) throw error;

            return {
                success: true,
                data,
                message: 'Attendance session created'
            };

        } catch (error) {
            console.error('Create session error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Generate unique 6-digit session code
     * @returns {Promise<string>} Unique code
     */
    async generateUniqueCode() {
        let code;
        let exists = true;
        
        while (exists) {
            code = String(Math.floor(100000 + Math.random() * 900000));
            
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
     * Get active session for a course
     * @param {string} courseId - Course UUID
     * @returns {Promise<Object>} Active session or null
     */
    async getActiveSession(courseId) {
        try {
            const { data, error } = await supabase
                .from('attendance_sessions')
                .select(`
                    *,
                    course:courses(id, course_code, course_name),
                    room:rooms(id, room_code, room_name, latitude, longitude, radius_meters),
                    lecturer:lecturers(id, full_name, initials)
                `)
                .eq('course_id', courseId)
                .eq('status', 'active')
                .gt('expires_at', new Date().toISOString())
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return { success: true, data: data || null };

        } catch (error) {
            console.error('Get active session error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get session by code (for student check-in)
     * @param {string} code - 6-digit session code
     * @returns {Promise<Object>} Session details
     */
    async getSessionByCode(code) {
        try {
            const { data, error } = await supabase
                .from('attendance_sessions')
                .select(`
                    *,
                    course:courses(id, course_code, course_name),
                    room:rooms(id, room_code, room_name, latitude, longitude, radius_meters),
                    lecturer:lecturers(id, full_name, initials)
                `)
                .eq('session_code', code)
                .eq('status', 'active')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { 
                        success: false, 
                        error: 'Invalid or expired session code',
                        code: 'SESSION_NOT_FOUND'
                    };
                }
                throw error;
            }

            // Check if session has expired
            if (new Date(data.expires_at) < new Date()) {
                return {
                    success: false,
                    error: 'Session has expired',
                    code: 'SESSION_EXPIRED'
                };
            }

            return { success: true, data };

        } catch (error) {
            console.error('Get session by code error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * End an active session
     * @param {string} sessionId - Session UUID
     * @returns {Promise<Object>} End result
     */
    async endSession(sessionId) {
        try {
            const { data, error } = await supabase
                .from('attendance_sessions')
                .update({
                    status: 'ended',
                    ended_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data,
                message: 'Session ended successfully'
            };

        } catch (error) {
            console.error('End session error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Extend session time
     * @param {string} sessionId - Session UUID
     * @param {number} additionalMinutes - Minutes to add
     * @returns {Promise<Object>} Update result
     */
    async extendSession(sessionId, additionalMinutes) {
        try {
            const { data: session, error: fetchError } = await supabase
                .from('attendance_sessions')
                .select('expires_at')
                .eq('id', sessionId)
                .single();

            if (fetchError) throw fetchError;

            const newExpiresAt = new Date(
                new Date(session.expires_at).getTime() + additionalMinutes * 60000
            );

            const { data, error } = await supabase
                .from('attendance_sessions')
                .update({
                    expires_at: newExpiresAt.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data,
                message: `Session extended by ${additionalMinutes} minutes`
            };

        } catch (error) {
            console.error('Extend session error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create a "No Class" session
     * @param {Object} noClassData - No class details
     * @returns {Promise<Object>} Created session
     */
    async createNoClassSession(noClassData) {
        try {
            const { courseId, lecturerId, date, reason } = noClassData;

            const { data, error } = await supabase
                .from('attendance_sessions')
                .insert({
                    course_id: courseId,
                    lecturer_id: lecturerId,
                    room_id: (await supabase.from('rooms').select('id').limit(1)).data[0].id,
                    session_code: '000000',
                    status: 'ended',
                    is_no_class: true,
                    no_class_reason: reason,
                    no_class_date: date,
                    expires_at: new Date().toISOString(),
                    ended_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Mark all enrolled students as excused
            const { data: enrollments } = await supabase
                .from('enrollments')
                .select('student_id')
                .eq('course_id', courseId)
                .eq('is_active', true);

            if (enrollments && enrollments.length > 0) {
                const logs = enrollments.map(e => ({
                    session_id: data.id,
                    student_id: e.student_id,
                    status: 'excused',
                    approval_status: 'not_required',
                    lecturer_initials: (await supabase
                        .from('lecturers')
                        .select('initials')
                        .eq('id', lecturerId)
                        .single()).data?.initials
                }));

                await supabase.from('attendance_logs').insert(logs);
            }

            return {
                success: true,
                data,
                message: 'No Class session created - all students excused'
            };

        } catch (error) {
            console.error('Create no class error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get session history for a course
     * @param {string} courseId - Course UUID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} List of sessions
     */
    async getSessionsHistory(courseId, options = {}) {
        try {
            const { limit = 50, offset = 0 } = options;

            const { data, error, count } = await supabase
                .from('attendance_sessions')
                .select(`
                    *,
                    lecturer:lecturers(id, full_name, initials),
                    room:rooms(id, room_code, room_name)
                `, { count: 'exact' })
                .eq('course_id', courseId)
                .order('started_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                success: true,
                data,
                total: count
            };

        } catch (error) {
            console.error('Get session history error:', error);
            return { success: false, error: error.message };
        }
    }
};

// =============================================
// SECTION 9: ATTENDANCE LOG FUNCTIONS
// =============================================

const AttendanceAPI = {

    /**
     * Submit attendance check-in
     * @param {Object} checkInData - Check-in details
     * @returns {Promise<Object>} Check-in result
     */
    async submitAttendance(checkInData) {
        try {
            const { sessionId, studentId, sessionCode, latitude, longitude } = checkInData;

            // Validate session exists and is active
            const { data: session, error: sessionError } = await supabase
                .from('attendance_sessions')
                .select(`
                    *,
                    room:rooms(latitude, longitude, radius_meters)
                `)
                .eq('id', sessionId)
                .eq('session_code', sessionCode)
                .eq('status', 'active')
                .single();

            if (sessionError || !session) {
                return {
                    success: false,
                    error: 'Invalid or expired session',
                    code: 'INVALID_SESSION'
                };
            }

            // Check if session has expired
            if (new Date(session.expires_at) < new Date()) {
                return {
                    success: false,
                    error: 'Session has expired',
                    code: 'SESSION_EXPIRED'
                };
            }

            // Validate GPS location
            const gpsValidation = this.validateGPS(
                latitude,
                longitude,
                session.room.latitude,
                session.room.longitude,
                session.room.radius_meters
            );

            // Validate device fingerprint
            const deviceValidation = await DeviceAPI.validateDevice(studentId, 'student');

            // Check if already checked in
            const { data: existingLog } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('session_id', sessionId)
                .eq('student_id', studentId)
                .single();

            if (existingLog) {
                return {
                    success: false,
                    error: 'Already checked in for this session',
                    code: 'ALREADY_CHECKED_IN',
                    data: existingLog
                };
            }

            // Determine approval status based on validations
            let approvalStatus = 'not_required';
            let status = 'present';

            if (!gpsValidation.isValid) {
                console.warn('GPS validation failed:', gpsValidation);
            }

            if (!deviceValidation.isValid) {
                if (deviceValidation.needsRegistration) {
                    status = 'pending';
                    approvalStatus = 'pending';
                } else if (deviceValidation.needsApproval) {
                    status = 'pending';
                    approvalStatus = 'pending';
                }
            }

            // Get lecturer initials for stamping
            const { data: courseLecturer } = await supabase
                .from('course_lecturers')
                .select('initials')
                .eq('course_id', session.course_id)
                .eq('lecturer_id', session.lecturer_id)
                .single();

            // Generate current fingerprint for storage
            const currentFingerprint = (await DeviceAPI.generateFingerprint()).fingerprint;

            // Create attendance log
            const { data: log, error: logError } = await supabase
                .from('attendance_logs')
                .insert({
                    session_id: sessionId,
                    student_id: studentId,
                    status: status,
                    verified_latitude: latitude,
                    verified_longitude: longitude,
                    is_gps_valid: gpsValidation.isValid,
                    device_fingerprint_used: currentFingerprint,
                    is_device_match: deviceValidation.isValid,
                    device_mismatch_details: !deviceValidation.isValid ? {
                        reason: deviceValidation.reason,
                        registeredDevice: deviceValidation.registeredDevice,
                        currentDevice: deviceValidation.currentDeviceInfo
                    } : null,
                    approval_status: approvalStatus,
                    lecturer_initials: courseLecturer?.initials || session.lecturer_id?.substring(0, 2).toUpperCase()
                })
                .select()
                .single();

            if (logError) throw logError;

            // If device mismatch, send notification to lecturer
            if (approvalStatus === 'pending') {
                await supabase.from('session_notifications').insert({
                    session_id: sessionId,
                    student_id: studentId,
                    notification_type: 'device_alert',
                    title: 'Device Mismatch Alert',
                    message: `Student device does not match registered device`,
                    data: {
                        log_id: log.id,
                        device_info: deviceValidation.currentDeviceInfo,
                        registered_device: deviceValidation.registeredDevice
                    }
                });
            }

            return {
                success: true,
                data: log,
                needsApproval: approvalStatus === 'pending',
                gpsValid: gpsValidation.isValid,
                deviceValid: deviceValidation.isValid,
                message: approvalStatus === 'pending'
                    ? 'Check-in submitted. Awaiting lecturer approval due to device mismatch.'
                    : 'Attendance submitted successfully'
            };

        } catch (error) {
            console.error('Submit attendance error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Validate GPS coordinates against session location
     * @param {number} userLat - User's latitude
     * @param {number} userLng - User's longitude
     * @param {number} centerLat - Session center latitude
     * @param {number} centerLng - Session center longitude
     * @param {number} radiusMeters - Allowed radius in meters
     * @returns {Object} Validation result
     */
    validateGPS(userLat, userLng, centerLat, centerLng, radiusMeters) {
        if (!userLat || !userLng) {
            return {
                isValid: false,
                error: 'GPS coordinates not available',
                code: 'GPS_UNAVAILABLE'
            };
        }

        // Calculate distance using Haversine formula
        const R = 6371000; // Earth's radius in meters
        const φ1 = userLat * Math.PI / 180;
        const φ2 = centerLat * Math.PI / 180;
        const Δφ = (centerLat - userLat) * Math.PI / 180;
        const Δλ = (centerLng - userLng) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;

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
     * Get pending approvals for a session
     * @param {string} sessionId - Session UUID
     * @returns {Promise<Object>} List of pending approvals
     */
    async getPendingApprovals(sessionId) {
        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .select(`
                    *,
                    student:students(id, matric_number, full_name, level, department:departments(name))
                `)
                .eq('session_id', sessionId)
                .eq('approval_status', 'pending')
                .order('check_in_time', { ascending: true });

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get pending approvals error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Approve a pending attendance
     * @param {string} logId - Log UUID
     * @param {string} lecturerId - Approving lecturer's UUID
     * @param {boolean} updateDevice - Whether to update student's device
     * @returns {Promise<Object>} Approval result
     */
    async approveAttendance(logId, lecturerId, updateDevice = true) {
        try {
            const { data: log, error: fetchError } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('id', logId)
                .single();

            if (fetchError) throw fetchError;

            // Update the log
            const { data, error } = await supabase
                .from('attendance_logs')
                .update({
                    status: 'present',
                    approval_status: 'approved',
                    approved_by: lecturerId,
                    approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', logId)
                .select()
                .single();

            if (error) throw error;

            // Update device if requested
            if (updateDevice && log.device_fingerprint_used) {
                await DeviceAPI.updateDeviceAfterApproval(
                    log.device_fingerprint_used,
                    log.student_id,
                    'student',
                    lecturerId
                );
            }

            // Notify student
            await supabase.from('session_notifications').insert({
                session_id: log.session_id,
                student_id: log.student_id,
                notification_type: 'attendance_approved',
                title: 'Attendance Approved',
                message: 'Your attendance has been approved by the lecturer.',
                data: { log_id: logId }
            });

            return {
                success: true,
                data,
                deviceUpdated: updateDevice,
                message: 'Attendance approved'
            };

        } catch (error) {
            console.error('Approve attendance error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Reject a pending attendance
     * @param {string} logId - Log UUID
     * @param {string} lecturerId - Rejecting lecturer's UUID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Rejection result
     */
    async rejectAttendance(logId, lecturerId, reason = '') {
        try {
            const { data: log } = await supabase
                .from('attendance_logs')
                .select('student_id, session_id')
                .eq('id', logId)
                .single();

            const { data, error } = await supabase
                .from('attendance_logs')
                .update({
                    status: 'absent',
                    approval_status: 'rejected',
                    approved_by: lecturerId,
                    approved_at: new Date().toISOString(),
                    rejection_reason: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', logId)
                .select()
                .single();

            if (error) throw error;

            // Notify student
            await supabase.from('session_notifications').insert({
                session_id: log?.session_id,
                student_id: log?.student_id,
                notification_type: 'attendance_rejected',
                title: 'Attendance Rejected',
                message: reason || 'Your attendance check-in was not approved.',
                data: { log_id: logId }
            });

            return {
                success: true,
                data,
                message: 'Attendance rejected'
            };

        } catch (error) {
            console.error('Reject attendance error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Manually add student to session
     * @param {string} sessionId - Session UUID
     * @param {string} matricNumber - Student's matric number
     * @param {string} lecturerId - Lecturer's UUID
     * @returns {Promise<Object>} Add result
     */
    async manualAddStudent(sessionId, matricNumber, lecturerId) {
        try {
            // Find student
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('id')
                .eq('matric_number', matricNumber)
                .single();

            if (studentError || !student) {
                return {
                    success: false,
                    error: 'Student not found',
                    code: 'STUDENT_NOT_FOUND'
                };
            }

            // Get lecturer initials
            const { data: session } = await supabase
                .from('attendance_sessions')
                .select('course_id, lecturer:lecturers(initials)')
                .eq('id', sessionId)
                .single();

            // Create or update log
            const { data, error } = await supabase
                .from('attendance_logs')
                .upsert({
                    session_id: sessionId,
                    student_id: student.id,
                    status: 'present',
                    approval_status: 'not_required',
                    manual_override: true,
                    override_by: lecturerId,
                    lecturer_initials: session?.lecturer?.initials || 'MAN',
                    is_device_match: true,
                    is_gps_valid: true
                }, {
                    onConflict: 'session_id,student_id'
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data,
                message: 'Student added manually'
            };

        } catch (error) {
            console.error('Manual add student error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get attendance log for a session
     * @param {string} sessionId - Session UUID
     * @returns {Promise<Object>} List of attendance records
     */
    async getSessionAttendance(sessionId) {
        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .select(`
                    *,
                    student:students(id, matric_number, full_name, level, department:departments(name, code))
                `)
                .eq('session_id', sessionId)
                .order('check_in_time', { ascending: true });

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get session attendance error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get student's attendance history for a course
     * @param {string} studentId - Student UUID
     * @param {string} courseId - Course UUID
     * @returns {Promise<Object>} Attendance history
     */
    async getStudentAttendanceHistory(studentId, courseId) {
        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .select(`
                    *,
                    session:attendance_sessions(
                        id,
                        started_at,
                        is_no_class,
                        no_class_reason,
                        room:rooms(room_code),
                        lecturer:lecturers(initials)
                    )
                `)
                .eq('student_id', studentId)
                .eq('session.course_id', courseId)
                .order('check_in_time', { ascending: false });

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get attendance history error:', error);
            return { success: false, error: error.message };
        }
    }
};

// =============================================
// SECTION 10: NOTIFICATION FUNCTIONS
// =============================================

const NotificationAPI = {

    /**
     * Get notifications for a student
     * @param {string} studentId - Student UUID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} List of notifications
     */
    async getNotifications(studentId, options = {}) {
        try {
            const { limit = 50, unreadOnly = false } = options;

            let query = supabase
                .from('session_notifications')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (unreadOnly) {
                query = query.eq('is_read', false);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };

        } catch (error) {
            console.error('Get notifications error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark notification as read
     * @param {string} notificationId - Notification UUID
     * @returns {Promise<Object>} Update result
     */
    async markAsRead(notificationId) {
        try {
            const { error } = await supabase
                .from('session_notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', notificationId);

            if (error) throw error;

            return { success: true };

        } catch (error) {
            console.error('Mark as read error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Mark all notifications as read
     * @param {string} studentId - Student UUID
     * @returns {Promise<Object>} Update result
     */
    async markAllAsRead(studentId) {
        try {
            const { error } = await supabase
                .from('session_notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('student_id', studentId)
                .eq('is_read', false);

            if (error) throw error;

            return { success: true, message: 'All notifications marked as read' };

        } catch (error) {
            console.error('Mark all as read error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get unread notification count
     * @param {string} studentId - Student UUID
     * @returns {Promise<Object>} Count result
     */
    async getUnreadCount(studentId) {
        try {
            const { count, error } = await supabase
                .from('session_notifications')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', studentId)
                .eq('is_read', false);

            if (error) throw error;

            return { success: true, count: count || 0 };

        } catch (error) {
            console.error('Get unread count error:', error);
            return { success: false, error: error.message };
        }
    }
};

// =============================================
// SECTION 11: REALTIME SUBSCRIPTIONS
// =============================================

const RealtimeAPI = {

    subscriptions: {},

    /**
     * Subscribe to active sessions for a course
     * @param {string} courseId - Course UUID
     * @param {Function} callback - Callback function for updates
     * @returns {Object} Subscription
     */
    subscribeToCourseSessions(courseId, callback) {
        const channel = supabase
            .channel(`course-sessions:${courseId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_sessions',
                    filter: `course_id=eq.${courseId}`
                },
                (payload) => {
                    console.log('Session update:', payload);
                    callback(payload);
                }
            )
            .subscribe();

        this.subscriptions[`course-sessions:${courseId}`] = channel;
        return channel;
    },

    /**
     * Subscribe to attendance updates for a session
     * @param {string} sessionId - Session UUID
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription
     */
    subscribeToSessionAttendance(sessionId, callback) {
        const channel = supabase
            .channel(`session-attendance:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_logs',
                    filter: `session_id=eq.${sessionId}`
                },
                (payload) => {
                    console.log('Attendance update:', payload);
                    callback(payload);
                }
            )
            .subscribe();

        this.subscriptions[`session-attendance:${sessionId}`] = channel;
        return channel;
    },

    /**
     * Subscribe to pending approvals for a session
     * @param {string} sessionId - Session UUID
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription
     */
    subscribeToPendingApprovals(sessionId, callback) {
        const channel = supabase
            .channel(`pending-approvals:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_logs',
                    filter: `session_id=eq.${sessionId}`,
                    // Note: Additional filter for pending status would need server-side handling
                },
                (payload) => {
                    if (payload.new?.approval_status === 'pending' || 
                        payload.old?.approval_status === 'pending') {
                        callback(payload);
                    }
                }
            )
            .subscribe();

        this.subscriptions[`pending-approvals:${sessionId}`] = channel;
        return channel;
    },

    /**
     * Subscribe to notifications for a student
     * @param {string} studentId - Student UUID
     * @param {Function} callback - Callback function
     * @returns {Object} Subscription
     */
    subscribeToNotifications(studentId, callback) {
        const channel = supabase
            .channel(`notifications:${studentId}`)
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
                    callback(payload);
                }
            )
            .subscribe();

        this.subscriptions[`notifications:${studentId}`] = channel;
        return channel;
    },

    /**
     * Unsubscribe from a channel
     * @param {string} channelKey - Channel key to unsubscribe
     */
    async unsubscribe(channelKey) {
        if (this.subscriptions[channelKey]) {
            await supabase.removeChannel(this.subscriptions[channelKey]);
            delete this.subscriptions[channelKey];
        }
    },

    /**
     * Unsubscribe from all channels
     */
    async unsubscribeAll() {
        for (const key of Object.keys(this.subscriptions)) {
            await this.unsubscribe(key);
        }
    }
};

// =============================================
// SECTION 12: UTILITY FUNCTIONS
// =============================================

const Utils = {

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @param {boolean} includeTime - Include time in output
     * @returns {string} Formatted date
     */
    formatDate(dateString, includeTime = false) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return date.toLocaleDateString('en-US', options);
    },

    /**
     * Format time remaining
     * @param {string} expiresAt - Expiration ISO string
     * @returns {string} Time remaining in MM:SS format
     */
    formatTimeRemaining(expiresAt) {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = Math.max(0, expires - now);

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Calculate distance between two GPS points
     * @param {number} lat1 - Latitude 1
     * @param {number} lon1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lon2 - Longitude 2
     * @returns {number} Distance in meters
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
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
     * Get current GPS position
     * @returns {Promise<Object>} Position or error
     */
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    },

    /**
     * Generate UUID v4
     * @returns {string} UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// =============================================
// SECTION 13: EXPORT FUNCTIONS
// =============================================

const ExportAPI = {

    /**
     * Export attendance data to CSV
     * @param {string} sessionId - Session UUID
     * @returns {Promise<Object>} Export result
     */
    async exportSessionCSV(sessionId) {
        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .select(`
                    student:students(matric_number, full_name, department:departments(name)),
                    status,
                    check_in_time,
                    is_device_match,
                    manual_override,
                    lecturer_initials
                `)
                .eq('session_id', sessionId)
                .order('student(matric_number)');

            if (error) throw error;

            // Get session info
            const { data: session } = await supabase
                .from('attendance_sessions')
                .select('*, course:courses(course_code, course_name), room:rooms(room_code)')
                .eq('id', sessionId)
                .single();

            // Create CSV content
            const headers = ['Matric Number', 'Name', 'Department', 'Status', 'Time', 'Device Match', 'Manual', 'Initials'];
            const rows = data.map(log => [
                log.student.matric_number,
                log.student.full_name,
                log.student.department?.name || '',
                log.status.toUpperCase(),
                this.formatDateTime(log.check_in_time),
                log.is_device_match ? 'Yes' : 'No',
                log.manual_override ? 'Yes' : 'No',
                log.lecturer_initials || ''
            ]);

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

            // Download file
            const filename = `${session.course.course_code}_Attendance_${this.formatDateForFile(session.started_at)}.csv`;
            this.downloadFile(csv, filename, 'text/csv');

            return { success: true, filename };

        } catch (error) {
            console.error('Export CSV error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Export master semester report
     * @param {string} courseId - Course UUID
     * @param {string} lecturerId - Lecturer UUID
     * @returns {Promise<Object>} Export result
     */
    async exportMasterReport(courseId, lecturerId) {
        try {
            // Get all sessions for the course
            const { data: sessions, error: sessionsError } = await supabase
                .from('attendance_sessions')
                .select('id, started_at, session_code, is_no_class')
                .eq('course_id', courseId)
                .eq('status', 'ended')
                .order('started_at', { ascending: true });

            if (sessionsError) throw sessionsError;

            // Get all enrolled students
            const { data: enrollments, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select(`
                    student:students(id, matric_number, full_name, department:departments(name))
                `)
                .eq('course_id', courseId)
                .eq('is_active', true)
                .order('student(matric_number)');

            if (enrollmentsError) throw enrollmentsError;

            // Get all attendance logs
            const sessionIds = sessions.map(s => s.id);
            const { data: logs } = await supabase
                .from('attendance_logs')
                .select('student_id, session_id, status, lecturer_initials')
                .in('session_id', sessionIds);

            // Build pivot table
            const studentMap = new Map();
            const sessionColumns = sessions.map(s => ({
                id: s.id,
                date: this.formatDate(s.started_at),
                isNoClass: s.is_no_class
            }));

            for (const enrollment of enrollments) {
                const student = enrollment.student;
                studentMap.set(student.id, {
                    matric: student.matric_number,
                    name: student.full_name,
                    department: student.department?.name || '',
                    sessions: {},
                    totalPresent: 0,
                    totalSessions: 0
                });
            }

            for (const log of logs || []) {
                const student = studentMap.get(log.student_id);
                if (student) {
                    student.sessions[log.session_id] = {
                        status: log.status,
                        initials: log.lecturer_initials
                    };
                }
            }

            // Calculate totals
            for (const [id, student] of studentMap) {
                for (const session of sessions) {
                    if (!session.is_no_class) {
                        student.totalSessions++;
                        const log = student.sessions[session.id];
                        if (log?.status === 'present') {
                            student.totalPresent++;
                        }
                    }
                }
            }

            // Create CSV
            const headers = ['Matric Number', 'Name', 'Department', ...sessionColumns.map(s => s.date), 'Total Present', 'Total Sessions', 'Percentage'];
            const rows = Array.from(studentMap.values()).map(student => {
                const sessionValues = sessionColumns.map(s => {
                    const log = student.sessions[s.id];
                    if (s.isNoClass) return 'NC';
                    if (!log) return 'A';
                    return log.status === 'present' ? 'P' : log.status === 'excused' ? 'E' : 'A';
                });

                const percentage = student.totalSessions > 0
                    ? Math.round((student.totalPresent / student.totalSessions) * 100)
                    : 0;

                return [
                    student.matric,
                    student.name,
                    student.department,
                    ...sessionValues,
                    student.totalPresent,
                    student.totalSessions,
                    `${percentage}%`
                ];
            });

            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

            // Get course info
            const { data: course } = await supabase
                .from('courses')
                .select('course_code, course_name')
                .eq('id', courseId)
                .single();

            const filename = `${course.course_code}_Master_Report_${this.formatDateForFile(new Date())}.csv`;
            this.downloadFile(csv, filename, 'text/csv');

            return { success: true, filename };

        } catch (error) {
            console.error('Export master report error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Helper: Format date for file naming
     */
    formatDateForFile(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    /**
     * Helper: Format date and time
     */
    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Helper: Download file
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

// =============================================
// INITIALIZATION
// =============================================

// Initialize Supabase when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeSupabase();
});

// Export all modules for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeSupabase,
        Auth,
        StudentAPI,
        LecturerAPI,
        CourseAPI,
        EnrollmentAPI,
        DeviceAPI,
        SessionAPI,
        AttendanceAPI,
        NotificationAPI,
        RealtimeAPI,
        Utils,
        ExportAPI
    };
}

// Global namespace for browser usage
window.AttendlyAPI = {
    initializeSupabase,
    Auth,
    StudentAPI,
    LecturerAPI,
    CourseAPI,
    EnrollmentAPI,
    DeviceAPI,
    SessionAPI,
    AttendanceAPI,
    NotificationAPI,
    RealtimeAPI,
    Utils,
    ExportAPI,
    supabase: () => supabase
};