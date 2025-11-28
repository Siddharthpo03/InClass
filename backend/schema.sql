-- ============================================
-- InClass Database Schema - Complete Setup
-- ============================================
-- 
-- This is the COMPLETE database schema file for InClass Attendance Management System.
-- All tables, columns, indexes, and migrations are included in this single file.
--
-- IMPORTANT: This script can be run multiple times safely (uses IF NOT EXISTS)
-- It will automatically add missing columns if the database already exists.
--
-- TO USE IN PGADMIN:
-- 1. Open pgAdmin
-- 2. Connect to your PostgreSQL database
-- 3. Right-click on your database -> Query Tool
-- 4. Copy and paste this ENTIRE file
-- 5. Execute (F5 or click Execute button)
--
-- ============================================

-- 1. USERS Table (Handles Admin, Faculty, and Student roles)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
    roll_no VARCHAR(50) UNIQUE,
    mobile_number VARCHAR(20), -- Country code + mobile number
    country_code VARCHAR(5) DEFAULT '+1', -- Country code (e.g., +1, +91, +44)
    passport_photo_url TEXT, -- URL/path to passport-sized photo
    college VARCHAR(255), -- College/University name
    department VARCHAR(255), -- Department name (for faculty)
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns if they don't exist (for existing databases)
DO $$ 
BEGIN
    -- Add mobile_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'mobile_number') THEN
        ALTER TABLE users ADD COLUMN mobile_number VARCHAR(20);
    END IF;

    -- Add country_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'country_code') THEN
        ALTER TABLE users ADD COLUMN country_code VARCHAR(5) DEFAULT '+1';
    END IF;

    -- Add passport_photo_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'passport_photo_url') THEN
        ALTER TABLE users ADD COLUMN passport_photo_url TEXT;
    END IF;

    -- Add college column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'college') THEN
        ALTER TABLE users ADD COLUMN college VARCHAR(255);
    END IF;

    -- Add department column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'department') THEN
        ALTER TABLE users ADD COLUMN department VARCHAR(255);
    END IF;
END $$;

-- 2. CLASSES Table (Managed by Faculty)
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_code VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    total_classes INTEGER DEFAULT 0 NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (faculty_id, course_code)
);

-- 3. SESSIONS Table (Attendance Code Management)
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ENROLLMENTS Table (Links Students to Classes)
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, class_id)
);

-- 5. FACE_ENCODINGS Table (Biometric face data)
CREATE TABLE IF NOT EXISTS face_encodings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    face_descriptor JSONB NOT NULL, -- Stores face descriptor array
    enrollment_image_url TEXT, -- Optional: store reference to enrollment image
    enrolled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 5.5. FINGERPRINT_DATA Table (WebAuthn credential data - Legacy)
CREATE TABLE IF NOT EXISTS fingerprint_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    credential_id TEXT NOT NULL UNIQUE, -- WebAuthn credential ID (base64url encoded)
    public_key TEXT NOT NULL, -- Public key (base64url encoded)
    counter BIGINT DEFAULT 0, -- Signature counter for replay attack prevention
    device_name VARCHAR(255), -- Optional: device/browser name
    enrolled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 5.6. WEBAUTHN_CREDENTIALS Table (WebAuthn/FIDO2 credential data for device biometrics)
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    credential_id TEXT NOT NULL UNIQUE, -- WebAuthn credential ID (base64url encoded)
    public_key TEXT NOT NULL, -- Public key (base64url encoded)
    counter BIGINT DEFAULT 0, -- Signature counter for replay attack prevention
    device_name VARCHAR(255), -- Optional: device/browser name
    enrolled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 5.7. BIOMETRIC_FACE Table (Encrypted face embeddings for face recognition)
CREATE TABLE IF NOT EXISTS biometric_face (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    encrypted_embedding TEXT NOT NULL, -- AES-256 encrypted face embedding (JSON array)
    enrolled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 5.8. BIOMETRIC_CONSENT Table (Records user consent for biometric data collection)
CREATE TABLE IF NOT EXISTS biometric_consent (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    method VARCHAR(50) DEFAULT 'both', -- 'webauthn', 'face', or 'both'
    ip_address VARCHAR(50),
    user_agent TEXT,
    consented_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 6. ATTENDANCE Table (Student records)
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'Present' NOT NULL CHECK (status IN ('Present', 'Absent', 'Manual')),
    ip_address VARCHAR(50),
    location TEXT,
    face_verified BOOLEAN DEFAULT FALSE, -- Whether face recognition was used
    face_match_score DECIMAL(5,4), -- Similarity score (0.0 to 1.0)
    fingerprint_verified BOOLEAN DEFAULT FALSE, -- Whether fingerprint verification was used
    fingerprint_credential_id TEXT, -- WebAuthn credential ID used for verification
    is_overridden BOOLEAN DEFAULT FALSE NOT NULL,
    override_reason TEXT,
    is_duplicate BOOLEAN DEFAULT FALSE NOT NULL, -- Flag for duplicate detection
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, session_id)
);

-- 7. EXPIRED_CODE_REPORTS Table (Use Case 04: Real-Time Reporting In Expired Codes)
CREATE TABLE IF NOT EXISTS expired_code_reports (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    report_reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    faculty_response TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITHOUT TIME ZONE
);

-- ============================================
-- INDEXES for Performance Optimization
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_roll_no ON users(roll_no);
CREATE INDEX IF NOT EXISTS idx_users_mobile_number ON users(mobile_number);

-- Classes table indexes
CREATE INDEX IF NOT EXISTS idx_classes_faculty_id ON classes(faculty_id);
CREATE INDEX IF NOT EXISTS idx_classes_course_code ON classes(course_code);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Enrollments table indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);

-- Face encodings table indexes
CREATE INDEX IF NOT EXISTS idx_face_encodings_user_id ON face_encodings(user_id);
CREATE INDEX IF NOT EXISTS idx_face_encodings_is_active ON face_encodings(is_active);

-- Fingerprint data table indexes
CREATE INDEX IF NOT EXISTS idx_fingerprint_data_user_id ON fingerprint_data(user_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_data_credential_id ON fingerprint_data(credential_id);
CREATE INDEX IF NOT EXISTS idx_fingerprint_data_is_active ON fingerprint_data(is_active);

-- WebAuthn credentials table indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_is_active ON webauthn_credentials(is_active);

-- Biometric face table indexes
CREATE INDEX IF NOT EXISTS idx_biometric_face_user_id ON biometric_face(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_face_is_active ON biometric_face(is_active);

-- Biometric consent table indexes
CREATE INDEX IF NOT EXISTS idx_biometric_consent_user_id ON biometric_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_consent_is_active ON biometric_consent(is_active);

-- Attendance table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_face_verified ON attendance(face_verified);

-- Expired Code Reports table indexes
CREATE INDEX IF NOT EXISTS idx_expired_code_reports_student_id ON expired_code_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_expired_code_reports_session_id ON expired_code_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_expired_code_reports_status ON expired_code_reports(status);

-- 8. PENDING_STUDENTS Table (Students waiting for faculty approval when no fingerprint)
CREATE TABLE IF NOT EXISTS pending_students (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    faculty_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    faculty_notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    UNIQUE (student_id, faculty_id)
);

-- Pending Students table indexes
CREATE INDEX IF NOT EXISTS idx_pending_students_student_id ON pending_students(student_id);
CREATE INDEX IF NOT EXISTS idx_pending_students_faculty_id ON pending_students(faculty_id);
CREATE INDEX IF NOT EXISTS idx_pending_students_status ON pending_students(status);

-- 9. COLLEGES Table (Real-world colleges and universities)
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100) DEFAULT 'United States',
    state VARCHAR(100),
    city VARCHAR(100),
    type VARCHAR(50) DEFAULT 'University', -- University, College, Institute, etc.
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. DEPARTMENTS Table (Academic departments)
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20), -- Department code (e.g., CS, MATH, ENG)
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name)
);

-- Colleges table indexes
CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_country ON colleges(country);
CREATE INDEX IF NOT EXISTS idx_colleges_is_active ON colleges(is_active);

-- Departments table indexes
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Insert real-world colleges and universities
INSERT INTO colleges (name, country, state, city, type) VALUES
-- United States Universities
('Massachusetts Institute of Technology', 'United States', 'Massachusetts', 'Cambridge', 'University'),
('Harvard University', 'United States', 'Massachusetts', 'Cambridge', 'University'),
('Stanford University', 'United States', 'California', 'Stanford', 'University'),
('University of California, Berkeley', 'United States', 'California', 'Berkeley', 'University'),
('California Institute of Technology', 'United States', 'California', 'Pasadena', 'Institute'),
('Yale University', 'United States', 'Connecticut', 'New Haven', 'University'),
('Princeton University', 'United States', 'New Jersey', 'Princeton', 'University'),
('University of Chicago', 'United States', 'Illinois', 'Chicago', 'University'),
('Columbia University', 'United States', 'New York', 'New York', 'University'),
('University of Pennsylvania', 'United States', 'Pennsylvania', 'Philadelphia', 'University'),
('Cornell University', 'United States', 'New York', 'Ithaca', 'University'),
('University of Michigan', 'United States', 'Michigan', 'Ann Arbor', 'University'),
('University of California, Los Angeles', 'United States', 'California', 'Los Angeles', 'University'),
('University of Texas at Austin', 'United States', 'Texas', 'Austin', 'University'),
('New York University', 'United States', 'New York', 'New York', 'University'),
('Carnegie Mellon University', 'United States', 'Pennsylvania', 'Pittsburgh', 'University'),
('University of Washington', 'United States', 'Washington', 'Seattle', 'University'),
('University of Illinois at Urbana-Champaign', 'United States', 'Illinois', 'Urbana', 'University'),
('Georgia Institute of Technology', 'United States', 'Georgia', 'Atlanta', 'Institute'),
('Duke University', 'United States', 'North Carolina', 'Durham', 'University'),
('Northwestern University', 'United States', 'Illinois', 'Evanston', 'University'),
('Johns Hopkins University', 'United States', 'Maryland', 'Baltimore', 'University'),
('University of California, San Diego', 'United States', 'California', 'San Diego', 'University'),
('University of Wisconsin-Madison', 'United States', 'Wisconsin', 'Madison', 'University'),
('University of Southern California', 'United States', 'California', 'Los Angeles', 'University'),
('Rice University', 'United States', 'Texas', 'Houston', 'University'),
('University of North Carolina at Chapel Hill', 'United States', 'North Carolina', 'Chapel Hill', 'University'),
('Boston University', 'United States', 'Massachusetts', 'Boston', 'University'),
('Pennsylvania State University', 'United States', 'Pennsylvania', 'University Park', 'University'),
('Ohio State University', 'United States', 'Ohio', 'Columbus', 'University'),
('Purdue University', 'United States', 'Indiana', 'West Lafayette', 'University'),
-- Indian Universities
('Indian Institute of Technology, Delhi', 'India', 'Delhi', 'New Delhi', 'Institute'),
('Indian Institute of Technology, Bombay', 'India', 'Maharashtra', 'Mumbai', 'Institute'),
('Indian Institute of Technology, Madras', 'India', 'Tamil Nadu', 'Chennai', 'Institute'),
('Indian Institute of Technology, Kanpur', 'India', 'Uttar Pradesh', 'Kanpur', 'Institute'),
('Indian Institute of Technology, Kharagpur', 'India', 'West Bengal', 'Kharagpur', 'Institute'),
('Indian Institute of Science', 'India', 'Karnataka', 'Bangalore', 'Institute'),
('Delhi University', 'India', 'Delhi', 'New Delhi', 'University'),
('Jawaharlal Nehru University', 'India', 'Delhi', 'New Delhi', 'University'),
('University of Mumbai', 'India', 'Maharashtra', 'Mumbai', 'University'),
('University of Calcutta', 'India', 'West Bengal', 'Kolkata', 'University'),
('Anna University', 'India', 'Tamil Nadu', 'Chennai', 'University'),
('Birla Institute of Technology and Science', 'India', 'Rajasthan', 'Pilani', 'Institute'),
('National Institute of Technology, Trichy', 'India', 'Tamil Nadu', 'Tiruchirappalli', 'Institute'),
('Vellore Institute of Technology', 'India', 'Tamil Nadu', 'Vellore', 'Institute'),
('Manipal Institute of Technology', 'India', 'Karnataka', 'Manipal', 'Institute')
ON CONFLICT (name) DO NOTHING;

-- Insert real-world academic departments
INSERT INTO departments (name, code, description) VALUES
('Computer Science', 'CS', 'Computer Science and Engineering'),
('Electrical Engineering', 'EE', 'Electrical and Electronics Engineering'),
('Mechanical Engineering', 'ME', 'Mechanical Engineering'),
('Civil Engineering', 'CE', 'Civil Engineering'),
('Chemical Engineering', 'CHE', 'Chemical Engineering'),
('Aerospace Engineering', 'AE', 'Aerospace and Aeronautical Engineering'),
('Biomedical Engineering', 'BME', 'Biomedical and Bioengineering'),
('Mathematics', 'MATH', 'Mathematics and Applied Mathematics'),
('Physics', 'PHY', 'Physics and Applied Physics'),
('Chemistry', 'CHEM', 'Chemistry and Chemical Sciences'),
('Biology', 'BIO', 'Biological Sciences'),
('Biotechnology', 'BT', 'Biotechnology and Life Sciences'),
('Information Technology', 'IT', 'Information Technology'),
('Electronics and Communication Engineering', 'ECE', 'Electronics and Communication Engineering'),
('Data Science', 'DS', 'Data Science and Analytics'),
('Artificial Intelligence', 'AI', 'Artificial Intelligence and Machine Learning'),
('Cybersecurity', 'CSEC', 'Cybersecurity and Information Security'),
('Software Engineering', 'SE', 'Software Engineering'),
('Business Administration', 'MBA', 'Business Administration and Management'),
('Economics', 'ECON', 'Economics and Finance'),
('English', 'ENG', 'English Language and Literature'),
('History', 'HIST', 'History and Social Sciences'),
('Psychology', 'PSY', 'Psychology and Behavioral Sciences'),
('Architecture', 'ARCH', 'Architecture and Design'),
('Pharmacy', 'PHARM', 'Pharmaceutical Sciences'),
('Medicine', 'MED', 'Medical Sciences'),
('Law', 'LAW', 'Law and Legal Studies'),
('Education', 'EDU', 'Education and Teaching'),
('Environmental Science', 'ENV', 'Environmental Science and Engineering'),
('Materials Science', 'MS', 'Materials Science and Engineering')
ON CONFLICT (name) DO NOTHING;
