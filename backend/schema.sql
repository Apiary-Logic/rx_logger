CREATE TYPE user_mode AS ENUM ('personal', 'clinical');
CREATE TYPE user_role AS ENUM ('full_user', 'append_only', 'read_only');
CREATE TYPE dosage_unit AS ENUM ('mg', 'g', 'mcg', 'IU', 'ml', 'units', 'puffs', 'drops', 'patches', 'tablets', 'capsules', 'suppositories', 'other');
CREATE TYPE route AS ENUM ('oral', 'sublingual', 'intramuscular', 'intravenous', 'topical', 'inhalation', 'rectal', 'vaginal', 'other');
CREATE TYPE event_type AS ENUM ('taken', 'missed', 'refused', 'late', 'corrected');
CREATE TYPE event_source AS ENUM ('manual', 'nfc', 'smart_bottle', 'scanner');
CREATE TYPE exception_code AS ENUM ('none', 'refused', 'other');
CREATE TYPE frequency_unit AS ENUM ('minutes', 'hours', 'days', 'weeks', 'months', 'years');
CREATE TYPE schedule_type AS ENUM ('fixed', 'as_needed', 'continuous', 'one_time');
CREATE TYPE adherence_status AS ENUM ('on_time', 'late', 'missed', 'extra_dose', 'refused', 'corrected');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    mode user_mode NOT NULL DEFAULT 'personal'
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name user_role UNIQUE NOT NULL
);

CREATE TABLE user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    dosage_amount NUMERIC(10, 3) NOT NULL,
    dosage_unit dosage_unit NOT NULL,
    route route NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    medication_id INT REFERENCES medications(id) ON DELETE CASCADE,
    schedule_type schedule_type NOT NULL,
    frequency INT,
    frequency_unit frequency_unit,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    specific_times TIME[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        start_date < end_date OR end_date IS NULL
    )
);

CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL UNIQUE,
    label TEXT,
    default_source event_source NOT NULL DEFAULT 'manual'
);

CREATE TABLE medication_events (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    medication_id INT REFERENCES medications(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMP NOT NULL,
    actual_time TIMESTAMP,
    event_type event_type NOT NULL,
    event_source event_source NOT NULL,
    exception_code exception_code NOT NULL DEFAULT 'none',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    corrected_event_id INT REFERENCES medication_events(id) ON DELETE SET NULL,
    -- Ensure actual_time logic based on event_type, with a tolerance of 1 hour into the future (acceptable)
    CONSTRAINT chk_actual_time CHECK (
        (
        event_type = 'taken'
        AND actual_time IS NOT NULL
        AND actual_time <= NOW() + INTERVAL '1 hour'
        )
        OR
        (
        event_type IN ('missed', 'refused')
        AND actual_time IS NULL
        )
        OR
        (
        event_type IN ('late', 'corrected')
        AND actual_time IS NOT NULL
        AND actual_time <= NOW() + INTERVAL '1 hour'
        )
    )
);

CREATE TABLE adherence_summary (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    medication_id INT REFERENCES medications(id) ON DELETE CASCADE,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    total_doses INT NOT NULL,
    doses_taken INT NOT NULL,
    doses_missed INT NOT NULL,
    doses_refused INT NOT NULL,
    adherence_percentage FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_period CHECK (period_start < period_end)
);

-- Recent events
CREATE INDEX idx_events_user_time ON medication_events(user_id, scheduled_time DESC);

-- Medications by user
CREATE INDEX idx_medications_user ON medications(user_id);

-- Schedules by medication
CREATE INDEX idx_schedules_medication ON schedules(medication_id);

CREATE INDEX idx_on_users_meds ON medication_events(user_id, medication_id, scheduled_time DESC);

-- Prevent deletions for clinical users
CREATE OR REPLACE FUNCTION prevent_clinical_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.mode = 'clinical' THEN
        RAISE EXCEPTION 'Deletion of clinical users is not allowed.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_clinical_user_deletion
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_clinical_user_deletion();

-- Block updates for clinical users (append only)
CREATE OR REPLACE FUNCTION prevent_clinical_user_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.mode = 'clinical' THEN
        RAISE EXCEPTION 'Updates to clinical users are not allowed.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_prevent_clinical_user_update
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_clinical_user_update();

-- Update updated_at timestamp on modifications
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_update_medications_timestamp
BEFORE UPDATE ON medications
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_schedules_timestamp
BEFORE UPDATE ON schedules
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_medication_events_timestamp
BEFORE UPDATE ON medication_events
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_adherence_summary_timestamp
BEFORE UPDATE ON adherence_summary
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
