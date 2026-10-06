-- PostgreSQL Initialization Script for DH Araria Hospital Portal
-- This script runs on first container startup

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_type AS ENUM ('OPD', 'TELECONSULTATION', 'EMERGENCY', 'FOLLOW_UP');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE blood_group AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE blood_component_type AS ENUM ('WHOLE_BLOOD', 'PACKED_RED_CELLS', 'PLATELETS', 'PLASMA', 'CRYOPRECIPITATE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE grievance_category AS ENUM ('MEDICAL_NEGLIGENCE', 'STAFF_BEHAVIOR', 'INFRASTRUCTURE', 'BILLING', 'APPOINTMENT', 'MEDICINE_AVAILABILITY', 'CLEANLINESS', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE grievance_status AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notice_category AS ENUM ('GENERAL', 'RECRUITMENT', 'TENDER', 'PUBLIC_HEALTH', 'SCHEDULE_CHANGE', 'EMERGENCY');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notice_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for performance (will be created by Prisma migrations)
-- This script ensures extensions are available

-- Set timezone
SET timezone = 'Asia/Kolkata';

-- Log initialization
INSERT INTO pg_stat_clear_snapshot();