-- Korisnici (admini)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin'
);

-- Aviokompanije
CREATE TABLE airlines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(255),
  iata_code VARCHAR(3) UNIQUE
);

CREATE TABLE flights (
  id SERIAL PRIMARY KEY,
  airline_id INTEGER REFERENCES airlines(id),
  flight_number VARCHAR(10) NOT NULL,
  departure_time TIMESTAMP, -- Dopuštamo NULL
  arrival_time TIMESTAMP,   -- Dopuštamo NULL
  destination VARCHAR(255) NOT NULL,
  is_departure BOOLEAN NOT NULL
);

-- Mjesečni raspored letova
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  flight_id INTEGER REFERENCES flights(id),
  schedule_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- CMS sadržaj
CREATE TABLE content (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(50) UNIQUE NOT NULL, -- npr. checkin-output-5
  image_url VARCHAR(255),
  flight_id INTEGER REFERENCES flights(id)
);