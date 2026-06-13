-- ══════════════════════════════════════════
-- DAKAR MOVE — Schéma de base de données
-- Djibril Gueye & Mamadou Lamine Toure
-- ISI Dakar 2026
-- ══════════════════════════════════════════

-- Extension PostGIS pour les coordonnées GPS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── TABLE USERS (chauffeurs) ──────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'driver',
  line_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLE LINES (lignes de bus) ───────────
CREATE TABLE IF NOT EXISTS lines (
  id SERIAL PRIMARY KEY,
  number VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#1A6B8A',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLE STOPS (arrêts) ──────────────────
CREATE TABLE IF NOT EXISTS stops (
  id SERIAL PRIMARY KEY,
  line_id INTEGER REFERENCES lines(id),
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stop_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── TABLE TRIPS (voyages) ─────────────────
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES users(id),
  line_id INTEGER REFERENCES lines(id),
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- ── TABLE BUS_POSITIONS (positions GPS) ───
CREATE TABLE IF NOT EXISTS bus_positions (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  driver_id INTEGER REFERENCES users(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- DONNÉES DE TEST
-- ══════════════════════════════════════════

-- Lignes urbaines DDD principales
INSERT INTO lines (number, name, origin, destination, color) VALUES
('7',  'Ligne 7',  'Gare Palais',             'Ouakam',                '#C4522A'),
('9',  'Ligne 9',  'Gare Palais',             'Liberté 6',             '#1A6B8A'),
('10', 'Ligne 10', 'Gare Palais',             'Liberté 5',             '#5A7A18'),
('23', 'Ligne 23', 'Gare Palais',             'Parcelles Assainies',   '#8A3A6A'),
('26', 'Ligne 26', 'Gare Palais',             'Guédiawaye',            '#C4872A')
ON CONFLICT DO NOTHING;

-- Arrêts Ligne 7 (Gare Palais → Ouakam)
INSERT INTO stops (line_id, name, latitude, longitude, stop_order) VALUES
(1, 'Gare Palais',         14.6937, -17.4441, 1),
(1, 'Place de l''Indépendance', 14.6928, -17.4467, 2),
(1, 'Kermel',              14.6912, -17.4423, 3),
(1, 'HLM',                 14.7089, -17.4502, 4),
(1, 'Liberté 5',           14.7198, -17.4587, 5),
(1, 'Liberté 6',           14.7243, -17.4623, 6),
(1, 'Fann Résidence',      14.7312, -17.4701, 7),
(1, 'Point E',             14.7356, -17.4734, 8),
(1, 'Mermoz',              14.7289, -17.4812, 9),
(1, 'Ouakam',              14.7198, -17.4923, 10);

-- Arrêts Ligne 23 (Gare Palais → Parcelles Assainies)
INSERT INTO stops (line_id, name, latitude, longitude, stop_order) VALUES
(4, 'Gare Palais',         14.6937, -17.4441, 1),
(4, 'Colobane',            14.7023, -17.4445, 2),
(4, 'Tilène',              14.7067, -17.4423, 3),
(4, 'Grand Médine',        14.7112, -17.4398, 4),
(4, 'VDN',                 14.7234, -17.4312, 5),
(4, 'Liberté 6',           14.7243, -17.4289, 6),
(4, 'Parcelles U10',       14.7389, -17.4198, 7),
(4, 'Parcelles U14',       14.7423, -17.4123, 8),
(4, 'Parcelles Assainies', 14.7456, -17.4067, 9);

-- Chauffeur de test (mot de passe : dakar2026)
INSERT INTO users (name, email, password, role, line_id) VALUES
('Moussa Diallo', 'moussa@dakarmove.sn', 
'$2a$10$rK8vJqZ5Y1mN3pX9wL2uOeHsT6cF4dR7gM0nI1bE5kA8jV3xP2qW', 
'driver', 1)
ON CONFLICT DO NOTHING;
