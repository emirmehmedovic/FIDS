CREATE TABLE display_sessions (
    id SERIAL PRIMARY KEY,
    flight_id INTEGER REFERENCES flights(id),
    page_id VARCHAR(10) NOT NULL,
    session_type VARCHAR(20) CHECK (session_type IN ('check-in', 'boarding')),
    is_priority BOOLEAN DEFAULT false,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);