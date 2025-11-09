-- Создание таблицы турниров
CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    weight_category VARCHAR(100) NOT NULL,
    age_category VARCHAR(100) NOT NULL,
    total_participants INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы участников
CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    seed_number INTEGER NOT NULL,
    weight_category VARCHAR(100),
    age_category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы матчей
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    participant1_id INTEGER,
    participant2_id INTEGER,
    winner_id INTEGER,
    score VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(tournament_id, round_number);